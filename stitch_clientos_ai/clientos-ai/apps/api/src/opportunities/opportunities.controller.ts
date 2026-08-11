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
import { OpportunitiesService } from './opportunities.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('opportunities')
@UseGuards(JwtAuthGuard)
export class OpportunitiesController {
  constructor(private opportunitiesService: OpportunitiesService) {}

  @Get()
  async list(@CurrentUser() user: any, @Query('stage') stage?: string) {
    return this.opportunitiesService.list(user.organization.id, { stage });
  }

  @Get(':id')
  async get(@CurrentUser() user: any, @Param('id') id: string) {
    return this.opportunitiesService.get(user.organization.id, id);
  }

  @Post()
  async create(@CurrentUser() user: any, @Body() body: any) {
    return this.opportunitiesService.create(user.organization.id, user.id, body);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.opportunitiesService.update(user.organization.id, id, body);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.opportunitiesService.delete(user.organization.id, id);
  }
}
