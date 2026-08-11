import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('portfolio')
@UseGuards(JwtAuthGuard)
export class PortfolioController {
  constructor(private portfolioService: PortfolioService) {}

  @Get()
  async get(@CurrentUser() user: any) {
    return this.portfolioService.get(user.organization.id);
  }

  @Post()
  async create(@CurrentUser() user: any, @Body() body: any) {
    return this.portfolioService.create(user.organization.id, body);
  }

  @Patch()
  async update(@CurrentUser() user: any, @Body() body: any) {
    return this.portfolioService.update(user.organization.id, body);
  }

  @Post('items')
  async addItem(@CurrentUser() user: any, @Body() body: any) {
    return this.portfolioService.addItem(user.organization.id, body);
  }

  @Patch('items/:itemId')
  async updateItem(
    @CurrentUser() user: any,
    @Param('itemId') itemId: string,
    @Body() body: any,
  ) {
    return this.portfolioService.updateItem(user.organization.id, itemId, body);
  }

  @Delete('items/:itemId')
  async deleteItem(
    @CurrentUser() user: any,
    @Param('itemId') itemId: string,
  ) {
    return this.portfolioService.deleteItem(user.organization.id, itemId);
  }
}
