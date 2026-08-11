import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@clientos/database';
import { createProspectSchema, updateProspectSchema } from '@clientos/validation';

@Injectable()
export class ProspectsService {
  async list(orgId: string, opts: { page?: number; pageSize?: number; search?: string; status?: string }) {
    const page = opts.page ?? 1;
    const pageSize = opts.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: any = { organizationId: orgId };
    if (opts.status) where.status = opts.status;
    if (opts.search) {
      where.OR = [
        { companyName: { contains: opts.search } },
        { email: { contains: opts.search } },
        { city: { contains: opts.search } },
      ];
    }

    const [prospects, total] = await Promise.all([
      prisma.prospect.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          industry: true,
          websiteAudits: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      }),
      prisma.prospect.count({ where }),
    ]);

    return {
      data: prospects,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async get(orgId: string, id: string) {
    const prospect = await prisma.prospect.findFirst({
      where: { id, organizationId: orgId },
      include: {
        industry: true,
        contacts: true,
        websiteAudits: {
          orderBy: { createdAt: 'desc' },
          include: { findings: true },
        },
        opportunities: {
          include: { service: true },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        emailThreads: {
          include: { messages: { orderBy: { createdAt: 'desc' } } },
        },
      },
    });
    if (!prospect) throw new NotFoundException('Prospect not found');
    return prospect;
  }

  async create(orgId: string, userId: string, data: any) {
    const parsed = createProspectSchema.parse(data);

    const prospect = await prisma.prospect.create({
      data: {
        organizationId: orgId,
        ...parsed,
        website: parsed.website || null,
        email: parsed.email || null,
      },
    });

    await prisma.activity.create({
      data: {
        organizationId: orgId,
        prospectId: prospect.id,
        userId,
        activityType: 'PROSPECT_CREATED',
        description: `${prospect.companyName} added as prospect`,
      },
    });

    return prospect;
  }

  async update(orgId: string, id: string, data: any) {
    const parsed = updateProspectSchema.parse(data);
    const existing = await prisma.prospect.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) throw new NotFoundException('Prospect not found');

    return prisma.prospect.update({
      where: { id },
      data: parsed,
    });
  }

  async delete(orgId: string, id: string) {
    const existing = await prisma.prospect.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) throw new NotFoundException('Prospect not found');

    return prisma.prospect.delete({ where: { id } });
  }

  async bulkCreate(orgId: string, userId: string, prospects: any[]) {
    const created = await Promise.all(
      prospects.map((p) =>
        prisma.prospect.create({
          data: {
            organizationId: orgId,
            companyName: p.companyName,
            website: p.website || null,
            phone: p.phone || null,
            email: p.email || null,
            country: p.country || null,
            city: p.city || null,
            address: p.address || null,
            description: p.description || null,
            rating: p.rating || null,
            reviewCount: p.reviewCount || null,
          },
        }),
      ),
    );

    await prisma.activity.create({
      data: {
        organizationId: orgId,
        userId,
        activityType: 'PROSPECT_CREATED',
        description: `${created.length} prospects imported`,
      },
    });

    return { created: created.length };
  }
}
