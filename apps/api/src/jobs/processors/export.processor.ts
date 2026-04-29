import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { StageUpdaterService } from '../../pipeline/stage-updater.service';
import { ExportJobPayload } from '@repo/shared-types';

@Processor('export-queue')
export class ExportProcessor {
  private readonly logger = new Logger(ExportProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stageUpdater: StageUpdaterService,
  ) {}

  @Process({ concurrency: 2 })
  async handle(job: Job<ExportJobPayload>) {
    const { pipelineRunId, stageId, videoUrl, path, platforms } = job.data;
    this.logger.log(`[run:${pipelineRunId}] Export job started (path: ${path})`);

    await this.stageUpdater.markInProgress(stageId, pipelineRunId);

    try {
      if (path === 'DOWNLOAD') {
        await this.stageUpdater.markCompleted(stageId, pipelineRunId, { outputUrl: videoUrl });
      } else if (path === 'PUBLISH') {
        this.logger.log(
          `[run:${pipelineRunId}] Publishing to platforms: ${platforms?.join(', ')}`,
        );
        await this.stageUpdater.markCompleted(stageId, pipelineRunId, {
          outputUrl: videoUrl,
          outputData: { platforms, publishedAt: new Date().toISOString() },
        });
      }

      // Mark the entire pipeline run as completed
      await this.stageUpdater.markRunCompleted(pipelineRunId);

      // Mark the idea as POSTED
      await this.prisma.idea.updateMany({
        where: { pipelineRuns: { some: { id: pipelineRunId } } },
        data: { status: 'POSTED' },
      });

      this.logger.log(`[run:${pipelineRunId}] Export stage completed — pipeline DONE`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`[run:${pipelineRunId}] Export stage failed: ${msg}`);
      await this.stageUpdater.markFailed(stageId, pipelineRunId, msg);
      throw err;
    }
  }
}
