import { Module } from '@nestjs/common';
import { IdeasController } from './ideas.controller';
import { IdeasService } from './ideas.service';
import { IdeasRepository } from './ideas.repository';

@Module({
  controllers: [IdeasController],
  providers: [IdeasService, IdeasRepository],
  exports: [IdeasService, IdeasRepository],
})
export class IdeasModule {}
