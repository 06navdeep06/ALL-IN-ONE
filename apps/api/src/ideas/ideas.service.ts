import { Injectable, NotFoundException } from '@nestjs/common';
import { IdeaStatus } from '@prisma/client';
import { IdeasRepository } from './ideas.repository';
import { CreateIdeaInput, UpdateIdeaInput } from '@repo/zod-schemas';

@Injectable()
export class IdeasService {
  constructor(private readonly ideasRepo: IdeasRepository) {}

  findAll(creatorId: string) {
    return this.ideasRepo.findAll(creatorId);
  }

  async findById(id: string, creatorId: string) {
    const idea = await this.ideasRepo.findById(id, creatorId);
    if (!idea) throw new NotFoundException(`Idea ${id} not found`);
    return idea;
  }

  create(creatorId: string, dto: CreateIdeaInput) {
    return this.ideasRepo.create(creatorId, dto);
  }

  async update(id: string, creatorId: string, dto: UpdateIdeaInput) {
    await this.findById(id, creatorId);
    return this.ideasRepo.update(id, creatorId, {
      title: dto.title,
      description: dto.description,
      score: dto.score,
      series: dto.series,
      episode: dto.episode,
      status: dto.status as IdeaStatus | undefined,
      postDate: dto.postDate,
    });
  }

  async delete(id: string, creatorId: string) {
    await this.findById(id, creatorId);
    await this.ideasRepo.delete(id, creatorId);
  }
}
