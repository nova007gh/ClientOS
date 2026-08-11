import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@clientos/database';
import { createServiceSchema, updateServiceSchema } from '@clientos/validation';

@Injectable()
export class ServicesService {
  async list(orgId: string) {
    return prisma.service.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      include: { serviceIndustries: { include: { industry: true } } },
    });
  }

  async get(orgId: string, id: string) {
    const service = await prisma.service.findFirst({
      where: { id, organizationId: orgId },
      include: { serviceIndustries: { include: { industry: true } } },
    });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async create(orgId: string, data: any) {
    const parsed = createServiceSchema.parse(data);
    return prisma.service.create({
      data: {
        organizationId: orgId,
        ...parsed,
      },
    });
  }

  async update(orgId: string, id: string, data: any) {
    const parsed = updateServiceSchema.parse(data);
    const existing = await prisma.service.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) throw new NotFoundException('Service not found');

    return prisma.service.update({
      where: { id },
      data: parsed,
    });
  }

  async delete(orgId: string, id: string) {
    const existing = await prisma.service.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) throw new NotFoundException('Service not found');

    return prisma.service.delete({ where: { id } });
  }
}
