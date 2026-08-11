import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@clientos/database';

@Injectable()
export class ProjectsService {
  async list(orgId: string, opts: { status?: string } = {}) {
    const where: any = { organizationId: orgId };
    if (opts.status) where.status = opts.status;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { tasks: true, milestones: true, members: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return { data: projects, total };
  }

  async get(orgId: string, id: string) {
    const project = await prisma.project.findFirst({
      where: { id, organizationId: orgId },
      include: {
        members: true,
        milestones: { orderBy: { dueDate: 'asc' } },
        tasks: { orderBy: { createdAt: 'desc' }, take: 50 },
        contract: { select: { id: true, title: true, status: true } },
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async create(orgId: string, data: any) {
    return prisma.project.create({
      data: {
        organizationId: orgId,
        clientId: data.clientId ?? null,
        name: data.name,
        description: data.description ?? '',
        status: data.status ?? 'PLANNING',
        startDate: data.startDate ? new Date(data.startDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        budget: data.budget ?? null,
        currency: data.currency ?? 'USD',
      },
    });
  }

  async update(orgId: string, id: string, data: any) {
    const existing = await prisma.project.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) throw new NotFoundException('Project not found');

    const patch: any = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.description !== undefined) patch.description = data.description;
    if (data.status !== undefined) patch.status = data.status;
    if (data.startDate !== undefined) {
      patch.startDate = data.startDate ? new Date(data.startDate) : null;
    }
    if (data.dueDate !== undefined) {
      patch.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }
    if (data.budget !== undefined) patch.budget = data.budget;
    if (data.currency !== undefined) patch.currency = data.currency;

    return prisma.project.update({ where: { id }, data: patch });
  }

  async delete(orgId: string, id: string) {
    const existing = await prisma.project.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) throw new NotFoundException('Project not found');
    return prisma.project.delete({ where: { id } });
  }
}
