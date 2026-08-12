import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('templates')
export class TemplatesController {
  constructor(private templatesService: TemplatesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(
    @CurrentUser() user: any,
    @Query('type') type?: string,
  ) {
    return this.templatesService.list(user.organization.id, type);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async get(@CurrentUser() user: any, @Param('id') id: string) {
    return this.templatesService.get(user.organization.id, id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser() user: any, @Body() body: any) {
    return this.templatesService.create(user.organization.id, body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.templatesService.update(user.organization.id, id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.templatesService.delete(user.organization.id, id);
  }
}
