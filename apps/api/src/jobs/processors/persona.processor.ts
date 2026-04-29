import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { AnthropicAdapter } from '../../integrations/anthropic/anthropic.adapter';
import { PersonaJobPayload } from '@repo/shared-types';

@Processor('persona-analysis-queue')
export class PersonaProcessor {
  private readonly logger = new Logger(PersonaProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly anthropic: AnthropicAdapter,
  ) {}

  @Process({ concurrency: 1 })
  async handle(job: Job<PersonaJobPayload>) {
    const { creatorId, socialUrls } = job.data;
    this.logger.log(`[creator:${creatorId}] Persona analysis started`);

    try {
      const prompt = [
        'Based on a creator\'s social media presence described below, generate a structured persona profile.',
        'Return ONLY a valid JSON object with keys:',
        '  scriptStructure (object with typical_hooks array, typical_ctas array),',
        '  avgVideoLengthSeconds (number),',
        '  captionStyle (string),',
        '  titleConventions (string),',
        '  toneDescriptor (string)',
        '',
        `Platforms: ${Object.entries(socialUrls)
          .filter(([, v]) => v)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ')}`,
        'Assume an active short-form video creator. Be specific and actionable.',
      ].join('\n');

      const message = await this.anthropic['client'].messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });

      const raw = message.content[0];
      if (raw.type !== 'text') throw new Error('Unexpected Anthropic response');

      const profile = JSON.parse(raw.text) as {
        scriptStructure: object;
        avgVideoLengthSeconds?: number;
        captionStyle?: string;
        titleConventions?: string;
        toneDescriptor?: string;
      };

      await this.prisma.personaProfile.upsert({
        where: { creatorId },
        create: {
          creatorId,
          scriptStructure: profile.scriptStructure,
          avgVideoLength: profile.avgVideoLengthSeconds,
          captionStyle: profile.captionStyle,
          titleConventions: profile.titleConventions,
          toneDescriptor: profile.toneDescriptor,
          rawExtracts: { socialUrls },
        },
        update: {
          scriptStructure: profile.scriptStructure,
          avgVideoLength: profile.avgVideoLengthSeconds,
          captionStyle: profile.captionStyle,
          titleConventions: profile.titleConventions,
          toneDescriptor: profile.toneDescriptor,
          rawExtracts: { socialUrls },
        },
      });

      this.logger.log(`[creator:${creatorId}] Persona profile saved`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`[creator:${creatorId}] Persona analysis failed: ${msg}`);
      throw err;
    }
  }
}
