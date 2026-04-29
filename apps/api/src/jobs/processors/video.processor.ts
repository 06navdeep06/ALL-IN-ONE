import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { HeyGenAdapter } from '../../integrations/heygen/heygen.adapter';
import { StageUpdaterService } from '../../pipeline/stage-updater.service';
import { VideoJobPayload } from '@repo/shared-types';

const POLL_INTERVAL_MS = 15_000;
const MAX_POLLS = 40;

@Processor('video-generation-queue')
export class VideoProcessor {
  private readonly logger = new Logger(VideoProcessor.name);

  constructor(
    private readonly heyGen: HeyGenAdapter,
    private readonly stageUpdater: StageUpdaterService,
  ) {}

  @Process({ concurrency: 1 })
  async handle(job: Job<VideoJobPayload>) {
    const { pipelineRunId, stageId, audioUrl, scriptText, avatarId, path, manualVideoUrl } = job.data;
    this.logger.log(`[run:${pipelineRunId}] Video job started (path: ${path})`);

    await this.stageUpdater.markInProgress(stageId, pipelineRunId);

    try {
      let videoUrl: string;

      if (path === 'SELF_RECORD' && manualVideoUrl) {
        videoUrl = manualVideoUrl;
      } else if (path === 'AI_AVATAR' && avatarId) {
        const { jobId } = await this.heyGen.generateVideo({
          avatarId,
          audioUrl,
          script: scriptText,
        });

        videoUrl = await this.pollForVideo(jobId, pipelineRunId);
      } else {
        throw new Error('Invalid video job configuration');
      }

      await this.stageUpdater.markCompleted(stageId, pipelineRunId, { outputUrl: videoUrl });
      this.logger.log(`[run:${pipelineRunId}] Video stage completed`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`[run:${pipelineRunId}] Video stage failed: ${msg}`);
      await this.stageUpdater.markFailed(stageId, pipelineRunId, msg);
      throw err;
    }
  }

  private async pollForVideo(jobId: string, runId: string): Promise<string> {
    for (let i = 0; i < MAX_POLLS; i++) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      const { status, videoUrl } = await this.heyGen.getVideoStatus(jobId);
      this.logger.log(`[run:${runId}] HeyGen poll ${i + 1}: ${status}`);

      if (status === 'completed' && videoUrl) return videoUrl;
      if (status === 'failed') throw new Error('HeyGen video generation failed');
    }
    throw new Error('HeyGen video generation timed out');
  }
}
