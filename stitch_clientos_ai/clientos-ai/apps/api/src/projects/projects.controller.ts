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
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  async list(@CurrentUser() user: any, @Query('status') status?: string) {
    return this.projectsService.list(user.organization.id, { status });
  }

  @Get(':id')
  async get(@CurrentUser() user: any, @Param('id') id: string) {
    return this.projectsService.get(user.organization.id, id);
  }

  @Post()
  async create(@CurrentUser() user: any, @Body() body: any) {
    return this.projectsService.create(user.organization.id, body);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.projectsService.update(user.organization.id, id, body);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.projectsService.delete(user.organization.id, id);
  }
}
