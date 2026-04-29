import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type VideoStatus = 'pending' | 'processing' | 'completed' | 'failed';

@Injectable()
export class HeyGenAdapter {
  private readonly logger = new Logger(HeyGenAdapter.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.heygen.com/v2';

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.getOrThrow<string>('HEYGEN_API_KEY');
  }

  async generateVideo(params: {
    avatarId: string;
    audioUrl: string;
    script: string;
  }): Promise<{ jobId: string }> {
    this.logger.log(`Generating video with avatar ${params.avatarId}`);

    const response = await fetch(`${this.baseUrl}/video/generate`, {
      method: 'POST',
      headers: {
        'X-Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        video_inputs: [
          {
            character: {
              type: 'avatar',
              avatar_id: params.avatarId,
              avatar_style: 'normal',
            },
            voice: {
              type: 'audio',
              audio_url: params.audioUrl,
            },
          },
        ],
        dimension: { width: 1080, height: 1920 },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HeyGen API error: ${response.status} — ${error}`);
    }

    const data = (await response.json()) as { data: { video_id: string } };
    return { jobId: data.data.video_id };
  }

  async getVideoStatus(jobId: string): Promise<{
    status: VideoStatus;
    videoUrl?: string;
  }> {
    const response = await fetch(`${this.baseUrl}/video_status.get?video_id=${jobId}`, {
      headers: { 'X-Api-Key': this.apiKey },
    });

    if (!response.ok) {
      throw new Error(`HeyGen status check error: ${response.status}`);
    }

    const data = (await response.json()) as {
      data: { status: string; video_url?: string };
    };

    const statusMap: Record<string, VideoStatus> = {
      pending: 'pending',
      processing: 'processing',
      completed: 'completed',
      failed: 'failed',
    };

    return {
      status: statusMap[data.data.status] ?? 'pending',
      videoUrl: data.data.video_url,
    };
  }
}
