import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PersonaService } from './persona.service';

@UseGuards(JwtAuthGuard)
@Controller('persona')
export class PersonaController {
  constructor(private readonly personaService: PersonaService) {}

  @Post('analyze')
  triggerAnalysis(
    @Body() body: { instagram?: string; tiktok?: string },
    @CurrentUser() user: { sub: string },
  ) {
    return this.personaService.triggerAnalysis(user.sub, body);
  }

  @Get('profile')
  getProfile(@CurrentUser() user: { sub: string }) {
    return this.personaService.getProfile(user.sub);
  }
}
