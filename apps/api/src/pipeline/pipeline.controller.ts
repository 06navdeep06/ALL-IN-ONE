import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PipelineService } from './pipeline.service';
import { ZodPipe } from '../common/pipes/zod.pipe';
import { StartPipelineSchema, StartPipelineInput, TriggerStageSchema } from '@repo/zod-schemas';
import { z } from 'zod';

type TriggerStageInput = z.infer<typeof TriggerStageSchema>;

@UseGuards(JwtAuthGuard)
@Controller('pipeline')
export class PipelineController {
  constructor(private readonly pipelineService: PipelineService) {}

  @Post('start')
  start(
    @Body(new ZodPipe(StartPipelineSchema)) dto: StartPipelineInput,
    @CurrentUser() user: { sub: string },
  ) {
    return this.pipelineService.startPipeline(dto.ideaId, user.sub);
  }

  @Post('trigger-stage')
  triggerStage(
    @Body(new ZodPipe(TriggerStageSchema)) dto: TriggerStageInput,
    @CurrentUser() user: { sub: string },
  ) {
    return this.pipelineService.triggerStage(
      dto.runId,
      user.sub,
      dto.stage as 'AUDIO' | 'VIDEO' | 'CAPTIONS' | 'EXPORT',
      dto.options ?? {},
    );
  }

  @Get('runs/:runId')
  getRun(
    @Param('runId') runId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.pipelineService.getRunWithStages(runId, user.sub);
  }

  @Get('ideas/:ideaId/runs')
  getRunsByIdea(
    @Param('ideaId') ideaId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.pipelineService.getRunsByIdea(ideaId, user.sub);
  }
}
