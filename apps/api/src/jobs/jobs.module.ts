import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ScriptProcessor } from './processors/script.processor';
import { AudioProcessor } from './processors/audio.processor';
import { VideoProcessor } from './processors/video.processor';
import { CaptionsProcessor } from './processors/captions.processor';
import { ExportProcessor } from './processors/export.processor';
import { PersonaProcessor } from './processors/persona.processor';
import { AnthropicAdapter } from '../integrations/anthropic/anthropic.adapter';
import { ElevenLabsAdapter } from '../integrations/elevenlabs/elevenlabs.adapter';
import { HeyGenAdapter } from '../integrations/heygen/heygen.adapter';
import { OpenAIAdapter } from '../integrations/openai/openai.adapter';
import { PipelineGateway } from '../pipeline/pipeline.gateway';
import { StageUpdaterService } from '../pipeline/stage-updater.service';

const QUEUES = [
  'script-generation-queue',
  'audio-generation-queue',
  'video-generation-queue',
  'caption-generation-queue',
  'export-queue',
  'persona-analysis-queue',
];

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const redisUrl = new URL(config.getOrThrow<string>('REDIS_URL'));
        return {
          redis: {
            host: redisUrl.hostname,
            port: Number(redisUrl.port) || 6379,
            password: redisUrl.password || undefined,
            tls: redisUrl.protocol === 'rediss:' ? {} : undefined,
          },
        };
      },
      inject: [ConfigService],
    }),
    ...QUEUES.map((name) => BullModule.registerQueue({ name })),
  ],
  providers: [
    ScriptProcessor,
    AudioProcessor,
    VideoProcessor,
    CaptionsProcessor,
    ExportProcessor,
    PersonaProcessor,
    AnthropicAdapter,
    ElevenLabsAdapter,
    HeyGenAdapter,
    OpenAIAdapter,
    PipelineGateway,
    StageUpdaterService,
  ],
  exports: [BullModule],
})
export class JobsModule {}
