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
import { CampaignsService } from './campaigns.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('campaigns')
@UseGuards(JwtAuthGuard)
export class CampaignsController {
  constructor(private campaignsService: CampaignsService) {}

  @Get()
  async list(@CurrentUser() user: any, @Query('status') status?: string) {
    return this.campaignsService.list(user.organization.id, { status });
  }

  @Get(':id')
  async get(@CurrentUser() user: any, @Param('id') id: string) {
    return this.campaignsService.get(user.organization.id, id);
  }

  @Post()
  async create(@CurrentUser() user: any, @Body() body: any) {
    return this.campaignsService.create(user.organization.id, user.id, body);
  }

  @Post(':id/prospects')
  async addProspects(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { prospectIds: string[] },
  ) {
    return this.campaignsService.addProspects(
      user.organization.id,
      id,
      body.prospectIds ?? [],
    );
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.campaignsService.update(user.organization.id, id, body);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.campaignsService.delete(user.organization.id, id);
  }
}
