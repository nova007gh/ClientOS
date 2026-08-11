import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { prisma } from '@clientos/database';

@Injectable()
export class OrganizationsService {
  async getOrganization(orgId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
            },
          },
        },
      },
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async update(orgId: string, data: { name?: string; country?: string; currency?: string; timezone?: string }) {
    return prisma.organization.update({
      where: { id: orgId },
      data,
    });
  }

  async getMembers(orgId: string) {
    return prisma.organizationMember.findMany({
      where: { organizationId: orgId, status: 'ACTIVE' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
        },
      },
    });
  }

  async inviteMember(orgId: string, email: string, role: string, inviterId: string) {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) throw new NotFoundException('User not found with that email');

    const existing = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId: user.id } },
    });
    if (existing && existing.status === 'ACTIVE') {
      throw new ConflictException('User is already a member');
    }

    return prisma.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: orgId, userId: user.id } },
      update: { role: role as any, status: 'ACTIVE' },
      create: {
        organizationId: orgId,
        userId: user.id,
        role: role as any,
        status: 'INVITED',
      },
    });
  }

  async updateMemberRole(orgId: string, userId: string, role: string) {
    const member = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });
    if (!member) throw new NotFoundException('Member not found');
    if (member.role === 'OWNER') throw new ForbiddenException('Cannot change owner role');

    return prisma.organizationMember.update({
      where: { organizationId_userId: { organizationId: orgId, userId } },
      data: { role: role as any },
    });
  }

  async removeMember(orgId: string, userId: string) {
    const member = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });
    if (!member) throw new NotFoundException('Member not found');
    if (member.role === 'OWNER') throw new ForbiddenException('Cannot remove owner');

    return prisma.organizationMember.update({
      where: { organizationId_userId: { organizationId: orgId, userId } },
      data: { status: 'REMOVED' },
    });
  }
}
