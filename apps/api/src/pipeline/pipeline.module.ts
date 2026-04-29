import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PipelineController } from './pipeline.controller';
import { PipelineService } from './pipeline.service';
import { PipelineRepository } from './pipeline.repository';
import { PipelineGateway } from './pipeline.gateway';
import { StageUpdaterService } from './stage-updater.service';
import { IdeasModule } from '../ideas/ideas.module';

@Module({
  imports: [
    IdeasModule,
    BullModule.registerQueue(
      { name: 'script-generation-queue' },
      { name: 'audio-generation-queue' },
      { name: 'video-generation-queue' },
      { name: 'caption-generation-queue' },
      { name: 'export-queue' },
    ),
  ],
  controllers: [PipelineController],
  providers: [PipelineService, PipelineRepository, PipelineGateway, StageUpdaterService],
  exports: [PipelineGateway, StageUpdaterService],
})
export class PipelineModule {}
