import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@clientos/database';

@Injectable()
export class TemplatesService {
  async list(orgId: string, type?: string) {
    const where: any = { organizationId: orgId };
    if (type) where.type = type;

    const templates = await prisma.template.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    return {
      data: templates.map((t: any) => ({
        id: t.id,
        name: t.name,
        category: t.category,
        type: t.type,
        subject: t.subject,
        body: t.body,
        content: t.content,
        active: t.active,
        open: t.openRate ?? '—',
        updatedAt: t.updatedAt.toISOString(),
      })),
    };
  }

  async get(orgId: string, id: string) {
    const template = await prisma.template.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!template) throw new NotFoundException('Template not found');
    return {
      id: template.id,
      name: template.name,
      category: template.category,
      type: template.type,
      subject: template.subject,
      body: template.body,
      content: template.content,
      active: template.active,
      open: template.openRate ?? '—',
      updatedAt: template.updatedAt.toISOString(),
    };
  }

  async create(orgId: string, data: any) {
    const template = await prisma.template.create({
      data: {
        organizationId: orgId,
        type: data.type ?? 'EMAIL',
        name: data.name,
        category: data.category ?? 'General',
        subject: data.subject ?? null,
        body: data.body ?? '',
        content: data.content ?? null,
        active: data.active ?? false,
        openRate: data.openRate ?? null,
      },
    });
    return this.get(orgId, template.id);
  }

  async update(orgId: string, id: string, data: any) {
    const existing = await prisma.template.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) throw new NotFoundException('Template not found');

    const patch: any = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.category !== undefined) patch.category = data.category;
    if (data.type !== undefined) patch.type = data.type;
    if (data.subject !== undefined) patch.subject = data.subject;
    if (data.body !== undefined) patch.body = data.body;
    if (data.content !== undefined) patch.content = data.content;
    if (data.active !== undefined) patch.active = data.active;
    if (data.openRate !== undefined) patch.openRate = data.openRate;

    await prisma.template.update({ where: { id }, data: patch });
    return this.get(orgId, id);
  }

  async delete(orgId: string, id: string) {
    const existing = await prisma.template.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) throw new NotFoundException('Template not found');
    await prisma.template.delete({ where: { id } });
    return { id };
  }
}
