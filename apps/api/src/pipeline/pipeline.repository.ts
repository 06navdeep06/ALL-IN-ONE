import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PipelineRun, PipelineStage, StageType } from '@prisma/client';

@Injectable()
export class PipelineRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createRun(ideaId: string, creatorId: string): Promise<PipelineRun> {
    return this.prisma.pipelineRun.create({
      data: { ideaId, creatorId, status: 'PENDING' },
    });
  }

  async findRunById(
    id: string,
    creatorId: string,
  ): Promise<(PipelineRun & { stages: PipelineStage[] }) | null> {
    return this.prisma.pipelineRun.findFirst({
      where: { id, creatorId },
      include: { stages: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async findRunsByIdea(ideaId: string, creatorId: string) {
    return this.prisma.pipelineRun.findMany({
      where: { ideaId, creatorId },
      include: { stages: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createStage(
    runId: string,
    stage: StageType,
  ): Promise<PipelineStage> {
    return this.prisma.pipelineStage.create({
      data: { runId, stage, status: 'PENDING' },
    });
  }

  async findStage(runId: string, stage: StageType): Promise<PipelineStage | null> {
    return this.prisma.pipelineStage.findUnique({
      where: { runId_stage: { runId, stage } },
    });
  }

  async findOrCreateStage(runId: string, stage: StageType): Promise<PipelineStage> {
    const existing = await this.findStage(runId, stage);
    if (existing) return existing;
    return this.createStage(runId, stage);
  }
}
