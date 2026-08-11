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
import { ProspectsService } from './prospects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('prospects')
@UseGuards(JwtAuthGuard)
export class ProspectsController {
  constructor(private prospectsService: ProspectsService) {}

  @Get()
  async list(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.prospectsService.list(user.organization.id, {
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 20,
      search,
      status,
    });
  }

  @Get(':id')
  async get(@CurrentUser() user: any, @Param('id') id: string) {
    return this.prospectsService.get(user.organization.id, id);
  }

  @Post()
  async create(@CurrentUser() user: any, @Body() body: any) {
    return this.prospectsService.create(user.organization.id, user.id, body);
  }

  @Post('bulk')
  async bulkCreate(@CurrentUser() user: any, @Body() body: { prospects: any[] }) {
    return this.prospectsService.bulkCreate(user.organization.id, user.id, body.prospects);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.prospectsService.update(user.organization.id, id, body);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.prospectsService.delete(user.organization.id, id);
  }
}
