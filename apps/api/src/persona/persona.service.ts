import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { PersonaJobPayload } from '@repo/shared-types';

@Injectable()
export class PersonaService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('persona-analysis-queue') private readonly personaQueue: Queue,
  ) {}

  async triggerAnalysis(creatorId: string, socialUrls: { instagram?: string; tiktok?: string }) {
    const payload: PersonaJobPayload = { creatorId, socialUrls };
    await this.personaQueue.add(payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
    });
    return { queued: true };
  }

  async getProfile(creatorId: string) {
    return this.prisma.personaProfile.findUnique({ where: { creatorId } });
  }
}
