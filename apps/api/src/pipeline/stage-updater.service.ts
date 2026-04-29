import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PipelineGateway } from './pipeline.gateway';

@Injectable()
export class StageUpdaterService {
  private readonly logger = new Logger(StageUpdaterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: PipelineGateway,
  ) {}

  async markInProgress(stageId: string, runId: string) {
    const stage = await this.prisma.pipelineStage.update({
      where: { id: stageId },
      data: { status: 'IN_PROGRESS', attempts: { increment: 1 } },
    });

    await this.prisma.pipelineRun.update({
      where: { id: runId },
      data: { status: 'IN_PROGRESS' },
    });

    this.gateway.emitStageUpdate(runId, {
      stageId: stage.id,
      stage: stage.stage,
      status: stage.status,
    });

    return stage;
  }

  async markCompleted(
    stageId: string,
    runId: string,
    output: { outputUrl?: string; outputData?: object },
  ) {
    const stage = await this.prisma.pipelineStage.update({
      where: { id: stageId },
      data: {
        status: 'COMPLETED',
        outputUrl: output.outputUrl,
        outputData: output.outputData ?? undefined,
      },
    });

    this.gateway.emitStageUpdate(runId, {
      stageId: stage.id,
      stage: stage.stage,
      status: stage.status,
      outputUrl: stage.outputUrl,
    });

    return stage;
  }

  async markFailed(stageId: string, runId: string, errorMsg: string) {
    const stage = await this.prisma.pipelineStage.update({
      where: { id: stageId },
      data: { status: 'FAILED', errorMsg },
    });

    this.gateway.emitStageUpdate(runId, {
      stageId: stage.id,
      stage: stage.stage,
      status: stage.status,
      errorMsg: stage.errorMsg,
    });

    return stage;
  }

  async markRunCompleted(runId: string) {
    await this.prisma.pipelineRun.update({
      where: { id: runId },
      data: { status: 'COMPLETED' },
    });
    this.gateway.emitRunComplete(runId, 'COMPLETED');
  }

  async markRunFailed(runId: string) {
    await this.prisma.pipelineRun.update({
      where: { id: runId },
      data: { status: 'FAILED' },
    });
    this.gateway.emitRunComplete(runId, 'FAILED');
  }
}
