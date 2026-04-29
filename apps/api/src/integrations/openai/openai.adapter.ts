import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIAdapter {
  private readonly logger = new Logger(OpenAIAdapter.name);
  private readonly client: OpenAI;

  constructor(private readonly config: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.config.getOrThrow<string>('OPENAI_API_KEY'),
    });
  }

  /**
   * Transcribe audio using OpenAI Whisper API.
   * Returns timestamped segments that can be converted to SRT.
   */
  async transcribe(audioBuffer: Buffer, filename = 'audio.mp3'): Promise<WhisperSegment[]> {
    this.logger.log('Transcribing audio with Whisper API');

    const file = new File([new Uint8Array(audioBuffer)], filename, { type: 'audio/mpeg' });

    const response = await this.client.audio.transcriptions.create({
      model: 'whisper-1',
      file,
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    });

    const segments: WhisperSegment[] = (
      (response as unknown as { segments?: WhisperRawSegment[] }).segments ?? []
    ).map((seg) => ({
      start: seg.start,
      end: seg.end,
      text: seg.text.trim(),
    }));

    this.logger.log(`Transcription complete: ${segments.length} segments`);
    return segments;
  }

  /**
   * Convert Whisper segments to SRT format.
   */
  segmentsToSrt(segments: WhisperSegment[]): string {
    return segments
      .map((seg, idx) => {
        const start = this.toSrtTimestamp(seg.start);
        const end = this.toSrtTimestamp(seg.end);
        return `${idx + 1}\n${start} --> ${end}\n${seg.text}\n`;
      })
      .join('\n');
  }

  private toSrtTimestamp(seconds: number): string {
    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0');
    const ms = Math.round((seconds % 1) * 1000)
      .toString()
      .padStart(3, '0');
    return `${h}:${m}:${s},${ms}`;
  }
}

export interface WhisperSegment {
  start: number;
  end: number;
  text: string;
}

interface WhisperRawSegment {
  start: number;
  end: number;
  text: string;
}
