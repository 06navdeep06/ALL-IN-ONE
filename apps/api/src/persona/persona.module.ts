import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PersonaController } from './persona.controller';
import { PersonaService } from './persona.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'persona-analysis-queue' })],
  controllers: [PersonaController],
  providers: [PersonaService],
})
export class PersonaModule {}
