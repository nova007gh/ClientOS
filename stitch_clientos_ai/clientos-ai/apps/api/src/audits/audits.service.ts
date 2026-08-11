import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@clientos/database';

@Injectable()
export class AuditsService {
  async list(orgId: string, opts: { status?: string; prospectId?: string } = {}) {
    const where: any = { prospect: { organizationId: orgId } };
    if (opts.status) where.status = opts.status;
    if (opts.prospectId) where.prospectId = opts.prospectId;

    const [audits, total] = await Promise.all([
      prisma.websiteAudit.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          prospect: { select: { id: true, companyName: true } },
          _count: { select: { findings: true } },
        },
      }),
      prisma.websiteAudit.count({ where }),
    ]);

    return { data: audits, total };
  }

  async get(orgId: string, id: string) {
    const audit = await prisma.websiteAudit.findFirst({
      where: { id, prospect: { organizationId: orgId } },
      include: {
        prospect: { select: { id: true, companyName: true, website: true } },
        findings: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!audit) throw new NotFoundException('Audit not found');
    return audit;
  }

  async create(orgId: string, data: { prospectId: string; websiteUrl: string }) {
    const prospect = await prisma.prospect.findFirst({
      where: { id: data.prospectId, organizationId: orgId },
    });
    if (!prospect) throw new NotFoundException('Prospect not found');

    return prisma.websiteAudit.create({
      data: {
        prospectId: data.prospectId,
        websiteUrl: data.websiteUrl,
        status: 'PENDING',
      },
      include: {
        prospect: { select: { id: true, companyName: true } },
        _count: { select: { findings: true } },
      },
    });
  }

  async delete(orgId: string, id: string) {
    const existing = await prisma.websiteAudit.findFirst({
      where: { id, prospect: { organizationId: orgId } },
    });
    if (!existing) throw new NotFoundException('Audit not found');
    return prisma.websiteAudit.delete({ where: { id } });
  }
}
