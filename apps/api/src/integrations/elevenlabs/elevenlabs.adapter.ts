import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ElevenLabsAdapter {
  private readonly logger = new Logger(ElevenLabsAdapter.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.elevenlabs.io/v1';

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.getOrThrow<string>('ELEVENLABS_API_KEY');
  }

  async generateSpeech(params: {
    text: string;
    voiceId: string;
    modelId?: string;
  }): Promise<Buffer> {
    this.logger.log(`Generating speech with voice ${params.voiceId}`);

    const response = await fetch(
      `${this.baseUrl}/text-to-speech/${params.voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: params.text,
          model_id: params.modelId ?? 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} — ${error}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    this.logger.log('Speech generated successfully');
    return Buffer.from(arrayBuffer);
  }
}
