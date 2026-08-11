import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { prisma } from '@clientos/database';

@Injectable()
export class ProposalsService {
  async list(orgId: string, opts: { status?: string } = {}) {
    const where: any = { organizationId: orgId };
    if (opts.status) where.status = opts.status;

    const [proposals, total] = await Promise.all([
      prisma.proposal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          opportunity: { select: { id: true, title: true } },
          _count: { select: { sections: true } },
        },
      }),
      prisma.proposal.count({ where }),
    ]);

    return { data: proposals, total };
  }

  async get(orgId: string, id: string) {
    const proposal = await prisma.proposal.findFirst({
      where: { id, organizationId: orgId },
      include: {
        opportunity: { select: { id: true, title: true } },
        sections: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!proposal) throw new NotFoundException('Proposal not found');
    return proposal;
  }

  async getByPublicToken(token: string) {
    const proposal = await prisma.proposal.findUnique({
      where: { publicToken: token },
      include: { sections: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!proposal) throw new NotFoundException('Proposal not found');

    if (proposal.status === 'SENT') {
      await prisma.proposal.update({
        where: { id: proposal.id },
        data: { status: 'VIEWED' },
      });
    }

    return proposal;
  }

  async create(orgId: string, data: any) {
    return prisma.proposal.create({
      data: {
        organizationId: orgId,
        opportunityId: data.opportunityId ?? null,
        clientId: data.clientId ?? null,
        title: data.title,
        status: data.status ?? 'DRAFT',
        total: data.total ?? null,
        currency: data.currency ?? 'USD',
        publicToken: randomBytes(24).toString('hex'),
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        sections: data.sections
          ? {
              create: data.sections.map((section: any, index: number) => ({
                sectionType: section.sectionType ?? 'CUSTOM',
                title: section.title,
                content: section.content ?? '',
                sortOrder: section.sortOrder ?? index,
              })),
            }
          : undefined,
      },
      include: { sections: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async update(orgId: string, id: string, data: any) {
    const existing = await prisma.proposal.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) throw new NotFoundException('Proposal not found');

    const patch: any = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.status !== undefined) patch.status = data.status;
    if (data.total !== undefined) patch.total = data.total;
    if (data.currency !== undefined) patch.currency = data.currency;
    if (data.expiresAt !== undefined) {
      patch.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    }

    return prisma.proposal.update({ where: { id }, data: patch });
  }

  async delete(orgId: string, id: string) {
    const existing = await prisma.proposal.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) throw new NotFoundException('Proposal not found');
    return prisma.proposal.delete({ where: { id } });
  }
}
