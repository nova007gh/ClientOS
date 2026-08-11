import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@clientos/database';

@Injectable()
export class CampaignsService {
  async list(orgId: string, opts: { status?: string } = {}) {
    const where: any = { organizationId: orgId };
    if (opts.status) where.status = opts.status;

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { prospects: true, steps: true } },
        },
      }),
      prisma.campaign.count({ where }),
    ]);

    return { data: campaigns, total };
  }

  async get(orgId: string, id: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id, organizationId: orgId },
      include: {
        steps: { orderBy: { stepNumber: 'asc' } },
        prospects: {
          include: { prospect: { select: { id: true, companyName: true } } },
        },
      },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async create(orgId: string, userId: string, data: any) {
    let emailAccountId = data.emailAccountId;
    if (!emailAccountId) {
      const account = await prisma.emailAccount.findFirst({ where: { organizationId: orgId } });
      if (!account) throw new NotFoundException('No email account found. Connect an email account first.');
      emailAccountId = account.id;
    }

    return prisma.campaign.create({
      data: {
        organizationId: orgId,
        createdBy: userId,
        emailAccountId,
        name: data.name,
        objective: data.objective ?? '',
        status: data.status ?? 'DRAFT',
        dailyLimit: data.dailyLimit ?? 50,
        timezone: data.timezone ?? 'UTC',
        steps: data.steps
          ? {
              create: data.steps.map((step: any, index: number) => ({
                stepNumber: step.stepNumber ?? index + 1,
                delayDays: step.delayDays ?? 0,
                type: step.type,
                instructions: step.instructions ?? '',
              })),
            }
          : undefined,
      },
      include: { steps: { orderBy: { stepNumber: 'asc' } } },
    });
  }

  async update(orgId: string, id: string, data: any) {
    const existing = await prisma.campaign.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) throw new NotFoundException('Campaign not found');

    const patch: any = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.objective !== undefined) patch.objective = data.objective;
    if (data.status !== undefined) patch.status = data.status;
    if (data.dailyLimit !== undefined) patch.dailyLimit = data.dailyLimit;
    if (data.timezone !== undefined) patch.timezone = data.timezone;

    return prisma.campaign.update({ where: { id }, data: patch });
  }

  async delete(orgId: string, id: string) {
    const existing = await prisma.campaign.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) throw new NotFoundException('Campaign not found');
    return prisma.campaign.delete({ where: { id } });
  }

  async addProspects(orgId: string, id: string, prospectIds: string[]) {
    const campaign = await prisma.campaign.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');

    const result = await prisma.campaignProspect.createMany({
      data: prospectIds.map((prospectId) => ({ campaignId: id, prospectId })),
    });

    return { added: result.count };
  }
}
