import { Queue, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const QUEUES = {
  LEAD_SCORING: 'lead-scoring',
  EMAIL_DRAFT: 'email-draft',
  WEBSITE_AUDIT: 'website-audit',
  GOOGLE_MAPS_SEARCH: 'google-maps-search',
  EMAIL_SEND: 'email-send',
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

export const queues: Record<QueueName, Queue> = {
  [QUEUES.LEAD_SCORING]: new Queue(QUEUES.LEAD_SCORING, { connection }),
  [QUEUES.EMAIL_DRAFT]: new Queue(QUEUES.EMAIL_DRAFT, { connection }),
  [QUEUES.WEBSITE_AUDIT]: new Queue(QUEUES.WEBSITE_AUDIT, { connection }),
  [QUEUES.GOOGLE_MAPS_SEARCH]: new Queue(QUEUES.GOOGLE_MAPS_SEARCH, { connection }),
  [QUEUES.EMAIL_SEND]: new Queue(QUEUES.EMAIL_SEND, { connection }),
};

export const queueEvents: Record<QueueName, QueueEvents> = {
  [QUEUES.LEAD_SCORING]: new QueueEvents(QUEUES.LEAD_SCORING, { connection }),
  [QUEUES.EMAIL_DRAFT]: new QueueEvents(QUEUES.EMAIL_DRAFT, { connection }),
  [QUEUES.WEBSITE_AUDIT]: new QueueEvents(QUEUES.WEBSITE_AUDIT, { connection }),
  [QUEUES.GOOGLE_MAPS_SEARCH]: new QueueEvents(QUEUES.GOOGLE_MAPS_SEARCH, { connection }),
  [QUEUES.EMAIL_SEND]: new QueueEvents(QUEUES.EMAIL_SEND, { connection }),
};

export async function addJob<T>(queueName: QueueName, name: string, data: T, opts?: { delay?: number; attempts?: number }) {
  const queue = queues[queueName];
  return queue.add(name, data, {
    attempts: opts?.attempts ?? 3,
    backoff: { type: 'exponential', delay: 5000 },
    ...(opts?.delay ? { delay: opts.delay } : {}),
  });
}
