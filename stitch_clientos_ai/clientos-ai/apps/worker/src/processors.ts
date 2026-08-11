import { Worker, Job } from 'bullmq';
import { prisma } from '@clientos/database';
import { connection, QUEUES, QueueName } from './queues';
import { scoreLead, draftEmail, auditWebsite } from './ai-client';

type JobHandler = (job: Job) => Promise<unknown>;

const SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as const;
type Severity = (typeof SEVERITIES)[number];

function normalizeSeverity(value: string): Severity {
  const upper = value.trim().toUpperCase();
  return (SEVERITIES as readonly string[]).includes(upper) ? (upper as Severity) : 'INFO';
}

const handlers: Record<QueueName, JobHandler> = {
  [QUEUES.LEAD_SCORING]: async (job: Job) => {
    const { prospectId, organizationId, userId } = job.data;
    const prospect = await prisma.prospect.findUnique({
      where: { id: prospectId },
      include: { industry: true },
    });
    if (!prospect) throw new Error(`Prospect ${prospectId} not found`);

    const services = await prisma.service.findMany({
      where: { organizationId, active: true },
      select: { name: true },
    });

    const result = await scoreLead({
      prospectId: prospect.id,
      organizationId,
      companyName: prospect.companyName,
      industry: prospect.industry?.name,
      website: prospect.website ?? undefined,
      city: prospect.city ?? undefined,
      country: prospect.country ?? undefined,
      rating: prospect.rating ?? undefined,
      reviewCount: prospect.reviewCount ?? undefined,
      hasWebsite: !!prospect.website,
      services: services.map((s) => s.name),
    });

    await prisma.prospect.update({
      where: { id: prospectId },
      data: { leadScore: result.score },
    });

    await prisma.activity.create({
      data: {
        organizationId,
        prospectId,
        userId,
        activityType: 'PROSPECT_UPDATED',
        description: `Lead scored ${result.score}/100 — ${result.reasoning}`,
        metadata: {
          score: result.score,
          priority: result.priority,
          recommendations: result.recommendations,
        },
      },
    });

    return result;
  },

  [QUEUES.EMAIL_DRAFT]: async (job: Job) => {
    const { prospectId, organizationId, serviceId, sender } = job.data;
    const prospect = await prisma.prospect.findUnique({
      where: { id: prospectId },
      include: { contacts: { orderBy: { isPrimary: 'desc' }, take: 1 } },
    });
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!prospect || !service) throw new Error('Prospect or service not found');

    const recipient = prospect.contacts[0]?.email;
    if (!recipient) throw new Error(`Prospect ${prospectId} has no contact email`);

    const result = await draftEmail({
      prospectName: prospect.companyName,
      prospectWebsite: prospect.website ?? undefined,
      serviceName: service.name,
      serviceDescription: service.description ?? undefined,
    });

    const subject = `Helping ${prospect.companyName} with ${service.name}`;

    const thread = await prisma.emailThread.create({
      data: {
        organizationId,
        prospectId,
        subject,
        messages: {
          create: {
            direction: 'OUTBOUND',
            sender: sender ?? 'no-reply@clientos.ai',
            recipient,
            subject,
            bodyText: result.email_body,
            status: 'DRAFT',
          },
        },
      },
      include: { messages: true },
    });

    return { threadId: thread.id, messageId: thread.messages[0]?.id, ...result };
  },

  [QUEUES.WEBSITE_AUDIT]: async (job: Job) => {
    const { prospectId, organizationId, userId, url } = job.data;
    const prospect = await prisma.prospect.findUnique({ where: { id: prospectId } });
    if (!prospect) throw new Error(`Prospect ${prospectId} not found`);

    const services = await prisma.service.findMany({
      where: { organizationId, active: true },
      select: { name: true },
    });

    const result = await auditWebsite({
      url,
      industry: prospect.industryId ?? undefined,
      services: services.map((s) => s.name),
    });

    const audit = await prisma.websiteAudit.create({
      data: {
        prospectId,
        websiteUrl: url,
        overallScore: result.overall_score,
        status: 'COMPLETED',
        completedAt: new Date(),
        findings: {
          create: result.findings.map((f) => ({
            category: f.category,
            severity: normalizeSeverity(f.severity),
            title: f.title,
            description: f.description,
            recommendation: f.recommendation,
          })),
        },
      },
    });

    await prisma.activity.create({
      data: {
        organizationId,
        prospectId,
        userId,
        activityType: 'AUDIT_COMPLETED',
        description: `Website audit completed — score: ${result.overall_score}/100`,
        metadata: { auditId: audit.id, summary: result.summary },
      },
    });

    return { auditId: audit.id, ...result };
  },

  [QUEUES.GOOGLE_MAPS_SEARCH]: async (job: Job) => {
    const { organizationId, query, city, country } = job.data;
    // In production: integrate with Google Places API
    // For now: log and return placeholder
    console.log(`[google-maps-search] Searching: ${query} in ${city}, ${country} for org ${organizationId}`);
    return { message: 'Google Maps search queued', organizationId };
  },

  [QUEUES.EMAIL_SEND]: async (job: Job) => {
    const { messageId } = job.data;
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new Error(`Message ${messageId} not found`);

    // In production: integrate with email provider (Resend, SendGrid, etc.)
    await prisma.message.update({
      where: { id: messageId },
      data: { status: 'SENT', sentAt: new Date() },
    });

    return { messageId, status: 'sent' };
  },
};

export function startWorkers() {
  const workers: Worker[] = [];

  for (const [queueName, handler] of Object.entries(handlers)) {
    const worker = new Worker(queueName, handler, {
      connection,
      concurrency: 5,
    });

    worker.on('completed', (job) => {
      console.log(`[${queueName}] Job ${job.id} completed`);
    });

    worker.on('failed', (job, err) => {
      console.error(`[${queueName}] Job ${job?.id} failed:`, err.message);
    });

    workers.push(worker);
  }

  return workers;
}
