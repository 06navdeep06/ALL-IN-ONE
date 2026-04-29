import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { StorageService } from '../../storage/storage.service';
import { OpenAIAdapter } from '../../integrations/openai/openai.adapter';
import { StageUpdaterService } from '../../pipeline/stage-updater.service';
import { CaptionsJobPayload } from '@repo/shared-types';

@Processor('caption-generation-queue')
export class CaptionsProcessor {
  private readonly logger = new Logger(CaptionsProcessor.name);

  constructor(
    private readonly storage: StorageService,
    private readonly openai: OpenAIAdapter,
    private readonly stageUpdater: StageUpdaterService,
  ) {}

  @Process({ concurrency: 3 })
  async handle(job: Job<CaptionsJobPayload>) {
    const { pipelineRunId, stageId, scriptText, audioUrl, path, creatorId } = job.data;
    this.logger.log(`[run:${pipelineRunId}] Captions job started (path: ${path})`);

    await this.stageUpdater.markInProgress(stageId, pipelineRunId);

    try {
      let captionsUrl: string;

      if (path === 'FROM_SCRIPT') {
        const srt = this.generateSrtFromScript(scriptText);
        const buffer = Buffer.from(srt, 'utf-8');
        captionsUrl = await this.storage.upload(buffer, {
          folder: `captions/${creatorId}`,
          extension: 'srt',
          contentType: 'text/plain',
        });
      } else if (path === 'FROM_AUDIO') {
        if (!audioUrl) throw new Error('audioUrl is required for FROM_AUDIO caption path');

        // Download audio from S3
        const audioResponse = await fetch(audioUrl);
        if (!audioResponse.ok) throw new Error(`Failed to download audio: ${audioResponse.status}`);
        const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());

        // Transcribe with OpenAI Whisper
        const segments = await this.openai.transcribe(audioBuffer);
        const srt = this.openai.segmentsToSrt(segments);

        const buffer = Buffer.from(srt, 'utf-8');
        captionsUrl = await this.storage.upload(buffer, {
          folder: `captions/${creatorId}`,
          extension: 'srt',
          contentType: 'text/plain',
        });
      } else {
        throw new Error(`Caption path '${path}' not yet implemented`);
      }

      await this.stageUpdater.markCompleted(stageId, pipelineRunId, { outputUrl: captionsUrl });

      this.logger.log(`[run:${pipelineRunId}] Captions stage completed`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`[run:${pipelineRunId}] Captions stage failed: ${msg}`);
      await this.stageUpdater.markFailed(stageId, pipelineRunId, msg);
      throw err;
    }
  }

  private generateSrtFromScript(script: string): string {
    const words = script.split(/\s+/);
    const wordsPerLine = 7;
    const secPerLine = 3;
    const lines: string[] = [];

    for (let i = 0; i < words.length; i += wordsPerLine) {
      const chunk = words.slice(i, i + wordsPerLine).join(' ');
      const idx = Math.floor(i / wordsPerLine);
      const start = this.toSrtTime(idx * secPerLine);
      const end = this.toSrtTime((idx + 1) * secPerLine);
      lines.push(`${idx + 1}\n${start} --> ${end}\n${chunk}\n`);
    }

    return lines.join('\n');
  }

  private toSrtTime(seconds: number): string {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s},000`;
  }
}
