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
import { ContractsService } from './contracts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('contracts')
export class ContractsController {
  constructor(private contractsService: ContractsService) {}

  @Get('public/:token')
  async getPublic(@Param('token') token: string) {
    return this.contractsService.getByPublicToken(token);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.contractsService.list(user.organization.id, { status, search });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async get(@CurrentUser() user: any, @Param('id') id: string) {
    return this.contractsService.get(user.organization.id, id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser() user: any, @Body() body: any) {
    return this.contractsService.create(user.organization.id, {
      ...body,
      createdBy: user.userId,
    });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.contractsService.update(user.organization.id, id, body);
  }

  @Post(':id/content')
  @UseGuards(JwtAuthGuard)
  async updateContent(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    return this.contractsService.updateContent(
      user.organization.id,
      id,
      content,
      user.userId,
    );
  }

  @Post(':id/parties')
  @UseGuards(JwtAuthGuard)
  async addParty(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.contractsService.addParty(user.organization.id, id, body);
  }

  @Post(':id/sign/:partyId')
  @UseGuards(JwtAuthGuard)
  async sign(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('partyId') partyId: string,
    @Body('signatureData') signatureData: string,
  ) {
    return this.contractsService.sign(
      user.organization.id,
      id,
      partyId,
      signatureData,
    );
  }

  @Post('public/:token/sign/:partyId')
  async signPublic(
    @Param('token') token: string,
    @Param('partyId') partyId: string,
    @Body() body: any,
  ) {
    return this.contractsService.signByPublicToken(
      token,
      partyId,
      body.signatureData,
      body.audit,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.contractsService.delete(user.organization.id, id);
  }
}
