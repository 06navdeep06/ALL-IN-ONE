import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { AnthropicAdapter } from '../../integrations/anthropic/anthropic.adapter';
import { StageUpdaterService } from '../../pipeline/stage-updater.service';
import { ScriptJobPayload } from '@repo/shared-types';

@Processor('script-generation-queue')
export class ScriptProcessor {
  private readonly logger = new Logger(ScriptProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly anthropic: AnthropicAdapter,
    private readonly stageUpdater: StageUpdaterService,
  ) {}

  @Process({ concurrency: 3 })
  async handle(job: Job<ScriptJobPayload>) {
    const { pipelineRunId, stageId, ideaId, creatorId, personaProfileId } = job.data;
    this.logger.log(`[run:${pipelineRunId}] Script job started`);

    await this.stageUpdater.markInProgress(stageId, pipelineRunId);

    try {
      const idea = await this.prisma.idea.findFirstOrThrow({
        where: { id: ideaId, creatorId },
      });

      let personaContext: string | undefined;
      if (personaProfileId) {
        const profile = await this.prisma.personaProfile.findUnique({
          where: { id: personaProfileId },
        });
        if (profile) {
          personaContext = JSON.stringify({
            toneDescriptor: profile.toneDescriptor,
            scriptStructure: profile.scriptStructure,
            captionStyle: profile.captionStyle,
            titleConventions: profile.titleConventions,
          });
        }
      }

      const script = await this.anthropic.generateScript({
        idea: `${idea.title}\n${idea.description ?? ''}`.trim(),
        personaContext,
        targetDuration: 60,
      });

      await this.stageUpdater.markCompleted(stageId, pipelineRunId, {
        outputData: script,
      });

      this.logger.log(`[run:${pipelineRunId}] Script stage completed`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`[run:${pipelineRunId}] Script stage failed: ${msg}`);
      await this.stageUpdater.markFailed(stageId, pipelineRunId, msg);
      throw err;
    }
  }
}
