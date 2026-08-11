import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private orgService: OrganizationsService) {}

  @Get('current')
  async getCurrentOrg(@CurrentUser() user: any) {
    if (!user.organization) return null;
    return this.orgService.getOrganization(user.organization.id);
  }

  @Patch('current')
  async updateCurrentOrg(
    @CurrentUser() user: any,
    @Body() body: { name?: string; country?: string; currency?: string; timezone?: string },
  ) {
    return this.orgService.update(user.organization.id, body);
  }

  @Get('current/members')
  async getMembers(@CurrentUser() user: any) {
    return this.orgService.getMembers(user.organization.id);
  }

  @Post('current/members')
  async inviteMember(
    @CurrentUser() user: any,
    @Body() body: { email: string; role: string },
  ) {
    return this.orgService.inviteMember(user.organization.id, body.email, body.role, user.id);
  }

  @Patch('current/members/:userId')
  async updateMemberRole(
    @CurrentUser() user: any,
    @Param('userId') userId: string,
    @Body() body: { role: string },
  ) {
    return this.orgService.updateMemberRole(user.organization.id, userId, body.role);
  }

  @Delete('current/members/:userId')
  async removeMember(
    @CurrentUser() user: any,
    @Param('userId') userId: string,
  ) {
    return this.orgService.removeMember(user.organization.id, userId);
  }
}
