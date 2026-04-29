import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IdeasService } from './ideas.service';
import { ZodPipe } from '../common/pipes/zod.pipe';
import { CreateIdeaSchema, UpdateIdeaSchema, CreateIdeaInput, UpdateIdeaInput } from '@repo/zod-schemas';

@UseGuards(JwtAuthGuard)
@Controller('ideas')
export class IdeasController {
  constructor(private readonly ideasService: IdeasService) {}

  @Get()
  findAll(@CurrentUser() user: { sub: string }) {
    return this.ideasService.findAll(user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.ideasService.findById(id, user.sub);
  }

  @Post()
  create(
    @Body(new ZodPipe(CreateIdeaSchema)) dto: CreateIdeaInput,
    @CurrentUser() user: { sub: string },
  ) {
    return this.ideasService.create(user.sub, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodPipe(UpdateIdeaSchema)) dto: UpdateIdeaInput,
    @CurrentUser() user: { sub: string },
  ) {
    return this.ideasService.update(id, user.sub, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.ideasService.delete(id, user.sub);
  }
}
