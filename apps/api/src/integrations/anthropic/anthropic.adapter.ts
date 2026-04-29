import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { ScriptOutput } from '@repo/shared-types';

const MODEL = 'claude-sonnet-4-20250514';

@Injectable()
export class AnthropicAdapter {
  private readonly logger = new Logger(AnthropicAdapter.name);
  private readonly client: Anthropic;

  constructor(private readonly config: ConfigService) {
    this.client = new Anthropic({
      apiKey: this.config.getOrThrow<string>('ANTHROPIC_API_KEY'),
    });
  }

  async generateScript(params: {
    idea: string;
    personaContext?: string;
    targetDuration: number;
  }): Promise<ScriptOutput> {
    this.logger.log(`Generating script for idea: "${params.idea}"`);

    const systemPrompt = [
      'You are a short-form video script writer specializing in TikTok, Instagram Reels, and YouTube Shorts.',
      'Generate a structured script with three clearly labelled sections: HOOK, BODY, and CTA.',
      `Target video duration: ${params.targetDuration} seconds.`,
      'Return ONLY a valid JSON object with keys: hook, body, cta, fullScript. No markdown, no prose.',
      params.personaContext
        ? `\n\nCreator persona context (match this style):\n${params.personaContext}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    const message = await this.client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Create a short-form video script for the following idea:\n\n${params.idea}`,
        },
      ],
    });

    const raw = message.content[0];
    if (raw.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic');
    }

    const parsed = JSON.parse(raw.text) as ScriptOutput;
    this.logger.log('Script generated successfully');
    return parsed;
  }
}
