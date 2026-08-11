import { Injectable } from '@nestjs/common';
import { prisma } from '@clientos/database';

@Injectable()
export class DashboardService {
  async getStats(orgId: string) {
    const [
      totalProspects,
      qualifiedLeads,
      activeCampaigns,
      pipelineValue,
      auditsCompleted,
      wonOpportunities,
      totalOpportunities,
      recentActivities,
      prospectsByStatus,
    ] = await Promise.all([
      prisma.prospect.count({ where: { organizationId: orgId } }),
      prisma.prospect.count({
        where: { organizationId: orgId, status: { in: ['QUALIFIED', 'REPLIED', 'MEETING'] } },
      }),
      prisma.campaign.count({
        where: { organizationId: orgId, status: 'RUNNING' },
      }),
      prisma.opportunity.aggregate({
        where: {
          organizationId: orgId,
          stage: { in: ['NEW', 'QUALIFIED', 'CONTACTED', 'REPLIED', 'MEETING', 'PROPOSAL', 'NEGOTIATION'] },
        },
        _sum: { value: true },
      }),
      prisma.websiteAudit.count({
        where: { prospect: { organizationId: orgId }, status: 'COMPLETED' },
      }),
      prisma.opportunity.count({
        where: { organizationId: orgId, stage: 'WON' },
      }),
      prisma.opportunity.count({
        where: { organizationId: orgId, stage: { notIn: ['LOST'] } },
      }),
      prisma.activity.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          activityType: true,
          description: true,
          createdAt: true,
          user: {
            select: { firstName: true, lastName: true },
          },
        },
      }),
      prisma.prospect.groupBy({
        by: ['status'],
        where: { organizationId: orgId },
        _count: { status: true },
      }),
    ]);

    const winRate = totalOpportunities > 0
      ? Math.round((wonOpportunities / totalOpportunities) * 100)
      : 0;

    const pipelineByStage = [
      { stage: 'New', count: 0, status: 'NEW' },
      { stage: 'Contacted', count: 0, status: 'CONTACTED' },
      { stage: 'Qualified', count: 0, status: 'QUALIFIED' },
      { stage: 'Proposal', count: 0, status: 'PROPOSAL' },
      { stage: 'Negotiation', count: 0, status: 'NEGOTIATION' },
      { stage: 'Won', count: 0, status: 'WON' },
    ];

    for (const item of prospectsByStatus) {
      const bucket = pipelineByStage.find((p) => p.status === item.status);
      if (bucket) bucket.count += item._count.status;
    }

    const totalProspectsInPipeline = pipelineByStage.reduce((sum, p) => sum + p.count, 0);
    const pipelineOverview = pipelineByStage.map((p) => ({
      stage: p.stage,
      count: p.count,
      pct: totalProspectsInPipeline > 0 ? Math.round((p.count / totalProspectsInPipeline) * 100) : 0,
    }));

    return {
      stats: {
        totalProspects,
        qualifiedLeads,
        activeCampaigns,
        pipelineValue: pipelineValue._sum.value ?? 0,
        auditsCompleted,
        winRate,
      },
      recentActivities: recentActivities.map((a) => ({
        id: a.id,
        type: a.activityType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
        description: a.description,
        createdAt: a.createdAt,
        user: a.user ? `${a.user.firstName} ${a.user.lastName}` : null,
      })),
      pipelineOverview,
    };
  }
}
