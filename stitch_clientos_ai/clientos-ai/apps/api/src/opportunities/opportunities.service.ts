import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@clientos/database';

@Injectable()
export class OpportunitiesService {
  async list(orgId: string, opts: { stage?: string } = {}) {
    const where: any = { organizationId: orgId };
    if (opts.stage) where.stage = opts.stage;

    const [opportunities, total] = await Promise.all([
      prisma.opportunity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { proposals: true, contracts: true } },
        },
      }),
      prisma.opportunity.count({ where }),
    ]);

    return { data: opportunities, total };
  }

  async get(orgId: string, id: string) {
    const opportunity = await prisma.opportunity.findFirst({
      where: { id, organizationId: orgId },
      include: {
        proposals: { orderBy: { createdAt: 'desc' } },
        contracts: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!opportunity) throw new NotFoundException('Opportunity not found');
    return opportunity;
  }

  async create(orgId: string, userId: string, data: any) {
    return prisma.opportunity.create({
      data: {
        organizationId: orgId,
        ownerId: userId,
        prospectId: data.prospectId,
        title: data.title,
        stage: data.stage ?? 'NEW',
        value: data.value ?? null,
        currency: data.currency ?? 'USD',
        probability: data.probability ?? 0,
        expectedCloseDate: data.expectedCloseDate
          ? new Date(data.expectedCloseDate)
          : null,
      },
    });
  }

  async update(orgId: string, id: string, data: any) {
    const existing = await prisma.opportunity.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) throw new NotFoundException('Opportunity not found');

    const patch: any = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.value !== undefined) patch.value = data.value;
    if (data.currency !== undefined) patch.currency = data.currency;
    if (data.probability !== undefined) patch.probability = data.probability;
    if (data.expectedCloseDate !== undefined) {
      patch.expectedCloseDate = data.expectedCloseDate
        ? new Date(data.expectedCloseDate)
        : null;
    }
    if (data.stage !== undefined) {
      patch.stage = data.stage;
      if (data.stage === 'WON') patch.wonAt = new Date();
      if (data.stage === 'LOST') patch.lostAt = new Date();
    }

    return prisma.opportunity.update({ where: { id }, data: patch });
  }

  async delete(orgId: string, id: string) {
    const existing = await prisma.opportunity.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) throw new NotFoundException('Opportunity not found');
    return prisma.opportunity.delete({ where: { id } });
  }
}
