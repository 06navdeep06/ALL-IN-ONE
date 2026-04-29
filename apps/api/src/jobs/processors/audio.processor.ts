import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { StorageService } from '../../storage/storage.service';
import { ElevenLabsAdapter } from '../../integrations/elevenlabs/elevenlabs.adapter';
import { StageUpdaterService } from '../../pipeline/stage-updater.service';
import { AudioJobPayload } from '@repo/shared-types';

@Processor('audio-generation-queue')
export class AudioProcessor {
  private readonly logger = new Logger(AudioProcessor.name);

  constructor(
    private readonly storage: StorageService,
    private readonly elevenLabs: ElevenLabsAdapter,
    private readonly stageUpdater: StageUpdaterService,
  ) {}

  @Process({ concurrency: 2 })
  async handle(job: Job<AudioJobPayload>) {
    const { pipelineRunId, stageId, creatorId, scriptText, voiceId, path, manualAudioUrl } = job.data;
    this.logger.log(`[run:${pipelineRunId}] Audio job started (path: ${path})`);

    await this.stageUpdater.markInProgress(stageId, pipelineRunId);

    try {
      let audioUrl: string;

      if (path === 'MANUAL_UPLOAD' && manualAudioUrl) {
        audioUrl = manualAudioUrl;
      } else {
        const audioBuffer = await this.elevenLabs.generateSpeech({
          text: scriptText,
          voiceId,
        });
        audioUrl = await this.storage.upload(audioBuffer, {
          folder: `audio/${creatorId}`,
          extension: 'mp3',
          contentType: 'audio/mpeg',
        });
      }

      await this.stageUpdater.markCompleted(stageId, pipelineRunId, { outputUrl: audioUrl });
      this.logger.log(`[run:${pipelineRunId}] Audio stage completed`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`[run:${pipelineRunId}] Audio stage failed: ${msg}`);
      await this.stageUpdater.markFailed(stageId, pipelineRunId, msg);
      throw err;
    }
  }
}
