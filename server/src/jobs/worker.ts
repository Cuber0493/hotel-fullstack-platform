import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { QUEUE_NAME, JOB_TYPES } from './queue.js';
import { emailService } from '../services/emailService.js';
import { metricsService } from '../services/metricsService.js';

export interface ProcessResult {
  jobId: string;
  name: string;
  success: boolean;
  result?: unknown;
}

/**
 * Core business processor executing operational background tasks.
 */
export async function executeJobTask(
  name: string,
  data: any,
  jobId: string = 'task-unknown'
): Promise<ProcessResult> {
  const startTime = performance.now();

  logger.info({
    event: 'job.active',
    jobId,
    jobName: name,
  });

  try {
    let result: unknown = null;

    switch (name) {
      case JOB_TYPES.BOOKING_CONFIRMATION:
        result = await emailService.sendBookingConfirmation(data);
        break;

      case JOB_TYPES.ENQUIRY_NOTIFICATION:
        result = await emailService.sendEnquiryNotification(data);
        break;

      case JOB_TYPES.NIGHTLY_METRICS_PRECOMPUTE: {
        const targetDate = data.date ? new Date(data.date) : new Date();
        const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

        const metrics = await metricsService.getMetrics({
          from: startOfMonth.toISOString().split('T')[0],
          to: endOfMonth.toISOString().split('T')[0],
        });

        // Broadcast or send nightly digest
        await emailService.sendMetricsDigest({
          date: targetDate.toISOString().split('T')[0],
          occupancyRate: metrics.overall.occupancyRate,
          adr: metrics.overall.adr,
          revpar: metrics.overall.revpar,
          totalRevenueInr: metrics.overall.roomRevenueInr,
          roomNightsSold: metrics.overall.roomNightsSold,
          roomNightsAvailable: metrics.overall.roomNightsAvailable,
        });

        result = {
          precomputedDate: targetDate.toISOString().split('T')[0],
          revpar: metrics.overall.revpar,
          occupancyRate: metrics.overall.occupancyRate,
        };
        break;
      }

      default:
        throw new Error(`Unrecognized job type: ${name}`);
    }

    const durationMs = Number((performance.now() - startTime).toFixed(2));

    logger.info({
      event: 'job.completed',
      jobId,
      jobName: name,
      durationMs,
    });

    return { jobId, name, success: true, result };
  } catch (err: any) {
    const durationMs = Number((performance.now() - startTime).toFixed(2));

    logger.error({
      event: 'job.failed',
      jobId,
      jobName: name,
      durationMs,
      error: err.message,
      stack: err.stack,
    });

    throw err;
  }
}

/**
 * Instantiates and starts the BullMQ background worker.
 */
export function startWorker(): Worker | null {
  if (!env.REDIS_URL || env.NODE_ENV === 'test') {
    logger.info({
      event: 'worker.skipped',
      message: 'Worker not started in live mode: REDIS_URL not configured or running in test mode.',
    });
    return null;
  }

  const isTls = env.REDIS_URL.startsWith('rediss://');
  const redisConnection = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    tls: isTls ? { rejectUnauthorized: false } : undefined,
  });

  const worker = new Worker(
    QUEUE_NAME,
    async (job: Job) => {
      return executeJobTask(job.name, job.data, job.id);
    },
    {
      connection: redisConnection as any,
      concurrency: 5,
    }
  );

  worker.on('active', (job) => {
    logger.info({
      event: 'worker.job_active',
      jobId: job.id,
      jobName: job.name,
      attemptsMade: job.attemptsMade,
    });
  });

  worker.on('completed', (job) => {
    logger.info({
      event: 'worker.job_completed',
      jobId: job.id,
      jobName: job.name,
    });
  });

  worker.on('failed', (job, err) => {
    logger.error({
      event: 'worker.job_failed',
      jobId: job?.id,
      jobName: job?.name,
      attemptsMade: job?.attemptsMade,
      error: err.message,
    });
  });

  worker.on('error', (err) => {
    logger.error({
      event: 'worker.error',
      error: err.message,
    });
  });

  logger.info({
    event: 'worker.started',
    queueName: QUEUE_NAME,
    concurrency: 5,
  });

  return worker;
}
