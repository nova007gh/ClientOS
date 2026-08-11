import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuditsService } from './audits.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('audits')
@UseGuards(JwtAuthGuard)
export class AuditsController {
  constructor(private auditsService: AuditsService) {}

  @Get()
  async list(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('prospectId') prospectId?: string,
  ) {
    return this.auditsService.list(user.organization.id, { status, prospectId });
  }

  @Get(':id')
  async get(@CurrentUser() user: any, @Param('id') id: string) {
    return this.auditsService.get(user.organization.id, id);
  }

  @Post()
  async create(@CurrentUser() user: any, @Body() body: { prospectId: string; websiteUrl: string }) {
    return this.auditsService.create(user.organization.id, body);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.auditsService.delete(user.organization.id, id);
  }
}
