import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PipelineRepository } from './pipeline.repository';
import { IdeasRepository } from '../ideas/ideas.repository';
import { PipelineStage } from '@prisma/client';
import {
  ScriptJobPayload,
  AudioJobPayload,
  VideoJobPayload,
  CaptionsJobPayload,
  ExportJobPayload,
} from '@repo/shared-types';

const JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 1000 },
  removeOnComplete: true,
};

@Injectable()
export class PipelineService {
  constructor(
    private readonly pipelineRepo: PipelineRepository,
    private readonly ideasRepo: IdeasRepository,
    @InjectQueue('script-generation-queue') private readonly scriptQueue: Queue,
    @InjectQueue('audio-generation-queue') private readonly audioQueue: Queue,
    @InjectQueue('video-generation-queue') private readonly videoQueue: Queue,
    @InjectQueue('caption-generation-queue') private readonly captionsQueue: Queue,
    @InjectQueue('export-queue') private readonly exportQueue: Queue,
  ) {}

  async startPipeline(ideaId: string, creatorId: string) {
    const idea = await this.ideasRepo.findById(ideaId, creatorId);
    if (!idea) throw new NotFoundException(`Idea ${ideaId} not found`);

    const run = await this.pipelineRepo.createRun(ideaId, creatorId);
    const stage = await this.pipelineRepo.findOrCreateStage(run.id, 'SCRIPT');

    const payload: ScriptJobPayload = {
      pipelineRunId: run.id,
      stageId: stage.id,
      ideaId,
      creatorId,
    };

    await this.scriptQueue.add(payload, JOB_OPTIONS);
    await this.ideasRepo.update(ideaId, creatorId, { status: 'IN_PROGRESS' });

    return this.pipelineRepo.findRunById(run.id, creatorId);
  }

  async triggerStage(
    runId: string,
    creatorId: string,
    stageType: 'AUDIO' | 'VIDEO' | 'CAPTIONS' | 'EXPORT',
    options: Record<string, unknown> = {},
  ) {
    const run = await this.pipelineRepo.findRunById(runId, creatorId);
    if (!run) throw new NotFoundException(`Pipeline run ${runId} not found`);

    const stage = await this.pipelineRepo.findOrCreateStage(runId, stageType);

    const base = {
      pipelineRunId: runId,
      stageId: stage.id,
      ideaId: run.ideaId,
      creatorId,
    };

    switch (stageType) {
      case 'AUDIO': {
        const scriptStage = run.stages.find((s: PipelineStage) => s.stage === 'SCRIPT' && s.status === 'COMPLETED');
        if (!scriptStage?.outputData) throw new BadRequestException('Script stage must be completed first');
        const scriptData = scriptStage.outputData as Record<string, string>;

        const payload: AudioJobPayload = {
          ...base,
          scriptText: scriptData.fullScript ?? `${scriptData.hook ?? ''}\n${scriptData.body ?? ''}\n${scriptData.cta ?? ''}`,
          voiceId: (options.voiceId as string) ?? '',
          path: (options.path as 'AI_VOICE' | 'MANUAL_UPLOAD') ?? 'AI_VOICE',
          manualAudioUrl: options.manualAudioUrl as string | undefined,
        };
        await this.audioQueue.add(payload, JOB_OPTIONS);
        break;
      }

      case 'VIDEO': {
        const audioStage = run.stages.find((s: PipelineStage) => s.stage === 'AUDIO' && s.status === 'COMPLETED');
        if (!audioStage?.outputUrl) throw new BadRequestException('Audio stage must be completed first');
        const scriptStage = run.stages.find((s: PipelineStage) => s.stage === 'SCRIPT' && s.status === 'COMPLETED');
        const scriptData = (scriptStage?.outputData ?? {}) as Record<string, string>;

        const payload: VideoJobPayload = {
          ...base,
          audioUrl: audioStage.outputUrl,
          scriptText: scriptData.fullScript ?? '',
          avatarId: options.avatarId as string | undefined,
          path: (options.path as 'SELF_RECORD' | 'AI_AVATAR') ?? 'SELF_RECORD',
          manualVideoUrl: options.manualVideoUrl as string | undefined,
        };
        await this.videoQueue.add(payload, JOB_OPTIONS);
        break;
      }

      case 'CAPTIONS': {
        const scriptStage = run.stages.find((s: PipelineStage) => s.stage === 'SCRIPT' && s.status === 'COMPLETED');
        const scriptData = (scriptStage?.outputData ?? {}) as Record<string, string>;
        const audioStage = run.stages.find((s: PipelineStage) => s.stage === 'AUDIO' && s.status === 'COMPLETED');

        const payload: CaptionsJobPayload = {
          ...base,
          scriptText: scriptData.fullScript ?? '',
          audioUrl: audioStage?.outputUrl ?? undefined,
          path: (options.path as 'FROM_SCRIPT' | 'FROM_AUDIO' | 'MANUAL') ?? 'FROM_SCRIPT',
        };
        await this.captionsQueue.add(payload, JOB_OPTIONS);
        break;
      }

      case 'EXPORT': {
        const videoStage = run.stages.find((s: PipelineStage) => s.stage === 'VIDEO' && s.status === 'COMPLETED');
        if (!videoStage?.outputUrl) throw new BadRequestException('Video stage must be completed first');
        const audioStage = run.stages.find((s: PipelineStage) => s.stage === 'AUDIO' && s.status === 'COMPLETED');
        const captionsStage = run.stages.find((s: PipelineStage) => s.stage === 'CAPTIONS' && s.status === 'COMPLETED');

        const payload: ExportJobPayload = {
          ...base,
          videoUrl: videoStage.outputUrl,
          audioUrl: audioStage?.outputUrl ?? '',
          captionsUrl: captionsStage?.outputUrl ?? undefined,
          path: (options.path as 'DOWNLOAD' | 'PUBLISH') ?? 'DOWNLOAD',
          platforms: options.platforms as Array<'TIKTOK' | 'INSTAGRAM' | 'YOUTUBE'> | undefined,
        };
        await this.exportQueue.add(payload, JOB_OPTIONS);
        break;
      }
    }

    return this.pipelineRepo.findRunById(runId, creatorId);
  }

  async getRunWithStages(runId: string, creatorId: string) {
    const run = await this.pipelineRepo.findRunById(runId, creatorId);
    if (!run) throw new NotFoundException(`Pipeline run ${runId} not found`);
    return run;
  }

  async getRunsByIdea(ideaId: string, creatorId: string) {
    return this.pipelineRepo.findRunsByIdea(ideaId, creatorId);
  }
}
