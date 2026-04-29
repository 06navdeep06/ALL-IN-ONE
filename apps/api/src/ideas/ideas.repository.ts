import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Idea, IdeaStatus } from '@prisma/client';

@Injectable()
export class IdeasRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(creatorId: string): Promise<Idea[]> {
    return this.prisma.idea.findMany({
      where: { creatorId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, creatorId: string): Promise<Idea | null> {
    return this.prisma.idea.findFirst({ where: { id, creatorId } });
  }

  async create(
    creatorId: string,
    data: {
      title: string;
      description?: string;
      score?: number;
      series?: string;
      episode?: number;
      postDate?: Date;
    },
  ): Promise<Idea> {
    return this.prisma.idea.create({ data: { ...data, creatorId } });
  }

  async update(
    id: string,
    creatorId: string,
    data: Partial<{
      title: string;
      description: string | null;
      score: number;
      series: string | null;
      episode: number | null;
      status: IdeaStatus;
      postDate: Date | null;
    }>,
  ): Promise<Idea> {
    return this.prisma.idea.update({ where: { id }, data });
  }

  async delete(id: string, creatorId: string): Promise<void> {
    await this.prisma.idea.deleteMany({ where: { id, creatorId } });
  }
}
