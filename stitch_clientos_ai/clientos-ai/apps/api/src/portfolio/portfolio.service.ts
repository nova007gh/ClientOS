import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@clientos/database';

@Injectable()
export class PortfolioService {
  async get(orgId: string) {
    const portfolio = await prisma.portfolio.findFirst({
      where: { organizationId: orgId },
      include: { items: { orderBy: { createdAt: 'desc' } } },
    });
    return portfolio;
  }

  async create(orgId: string, data: any) {
    return prisma.portfolio.create({
      data: {
        organizationId: orgId,
        username: data.username,
        headline: data.headline ?? '',
        bio: data.bio ?? '',
        published: data.published ?? false,
      },
      include: { items: true },
    });
  }

  async update(orgId: string, data: any) {
    const existing = await prisma.portfolio.findFirst({
      where: { organizationId: orgId },
    });
    if (!existing) throw new NotFoundException('Portfolio not found');

    const patch: any = {};
    if (data.username !== undefined) patch.username = data.username;
    if (data.headline !== undefined) patch.headline = data.headline;
    if (data.bio !== undefined) patch.bio = data.bio;
    if (data.published !== undefined) patch.published = data.published;

    return prisma.portfolio.update({ where: { id: existing.id }, data: patch });
  }

  async addItem(orgId: string, data: any) {
    const portfolio = await prisma.portfolio.findFirst({
      where: { organizationId: orgId },
    });
    if (!portfolio) throw new NotFoundException('Portfolio not found');

    return prisma.portfolioItem.create({
      data: {
        portfolioId: portfolio.id,
        projectId: data.projectId,
        title: data.title,
        description: data.description ?? '',
        featuredImage: data.featuredImage ?? null,
        published: data.published ?? false,
      },
    });
  }

  async updateItem(orgId: string, itemId: string, data: any) {
    const portfolio = await prisma.portfolio.findFirst({
      where: { organizationId: orgId },
    });
    if (!portfolio) throw new NotFoundException('Portfolio not found');

    const item = await prisma.portfolioItem.findFirst({
      where: { id: itemId, portfolioId: portfolio.id },
    });
    if (!item) throw new NotFoundException('Portfolio item not found');

    const patch: any = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.description !== undefined) patch.description = data.description;
    if (data.featuredImage !== undefined) patch.featuredImage = data.featuredImage;
    if (data.published !== undefined) patch.published = data.published;

    return prisma.portfolioItem.update({ where: { id: itemId }, data: patch });
  }

  async deleteItem(orgId: string, itemId: string) {
    const portfolio = await prisma.portfolio.findFirst({
      where: { organizationId: orgId },
    });
    if (!portfolio) throw new NotFoundException('Portfolio not found');

    const item = await prisma.portfolioItem.findFirst({
      where: { id: itemId, portfolioId: portfolio.id },
    });
    if (!item) throw new NotFoundException('Portfolio item not found');

    return prisma.portfolioItem.delete({ where: { id: itemId } });
  }
}
