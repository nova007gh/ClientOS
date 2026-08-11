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
import { ProposalsService } from './proposals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('proposals')
export class ProposalsController {
  constructor(private proposalsService: ProposalsService) {}

  @Get('public/:token')
  async getPublic(@Param('token') token: string) {
    return this.proposalsService.getByPublicToken(token);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(@CurrentUser() user: any, @Query('status') status?: string) {
    return this.proposalsService.list(user.organization.id, { status });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async get(@CurrentUser() user: any, @Param('id') id: string) {
    return this.proposalsService.get(user.organization.id, id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser() user: any, @Body() body: any) {
    return this.proposalsService.create(user.organization.id, body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.proposalsService.update(user.organization.id, id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.proposalsService.delete(user.organization.id, id);
  }
}
