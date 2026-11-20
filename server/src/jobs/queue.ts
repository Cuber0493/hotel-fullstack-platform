import { Queue, JobsOptions } from 'bullmq';
import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';
import {
  BookingEmailPayload,
  EnquiryEmailPayload,
  MetricsDigestPayload,
} from '../services/emailService.js';

export const QUEUE_NAME = 'hotel-operational-queue';

export const JOB_TYPES = {
  BOOKING_CONFIRMATION: 'booking-confirmation',
  ENQUIRY_NOTIFICATION: 'enquiry-notification',
  NIGHTLY_METRICS_PRECOMPUTE: 'nightly-metrics-precompute',
} as const;

export const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000, // 2s -> 4s -> 8s
  },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
};

export interface JobRecord<T = unknown> {
  id: string;
  name: string;
  data: T;
  timestamp: number;
  attemptsMade: number;
  status: 'enqueued' | 'active' | 'completed' | 'failed';
}

export class OperationalJobQueue {
  private queue: Queue | null = null;
  private redisConnection: Redis | null = null;
  private inMemoryQueue: JobRecord[] = [];
  public isMockMode: boolean;

  constructor() {
    this.isMockMode = !env.REDIS_URL || env.NODE_ENV === 'test';
    this.init();
  }

  private init() {
    if (!this.isMockMode && env.REDIS_URL) {
      try {
        const isTls = env.REDIS_URL.startsWith('rediss://');
        this.redisConnection = new Redis(env.REDIS_URL, {
          maxRetriesPerRequest: null, // Mandatory for BullMQ
          enableReadyCheck: false,
          tls: isTls ? { rejectUnauthorized: false } : undefined,
        });

        this.queue = new Queue(QUEUE_NAME, {
          connection: this.redisConnection as any,
          defaultJobOptions: DEFAULT_JOB_OPTIONS,
        });

        logger.info({ event: 'queue.connected', queueName: QUEUE_NAME, provider: 'Upstash/Redis' });
      } catch (err: any) {
        logger.warn({
          event: 'queue.redis_fallback',
          message: 'Failed to connect to Redis. Operating in in-memory mode.',
          error: err.message,
        });
        this.isMockMode = true;
      }
    } else {
      logger.info({ event: 'queue.mock_mode', message: 'Operating in mock / test queue mode' });
    }
  }

  /**
   * Enqueues booking confirmation email job.
   */
  async enqueueBookingConfirmation(payload: BookingEmailPayload, customOptions?: JobsOptions) {
    return this.addJob(JOB_TYPES.BOOKING_CONFIRMATION, payload, customOptions);
  }

  /**
   * Enqueues admin notification for new bespoke event enquiry.
   */
  async enqueueEnquiryNotification(payload: EnquiryEmailPayload, customOptions?: JobsOptions) {
    return this.addJob(JOB_TYPES.ENQUIRY_NOTIFICATION, payload, customOptions);
  }

  /**
   * Enqueues nightly metrics precomputation job.
   */
  async enqueueNightlyMetricsPrecompute(
    payload: { date?: string } = {},
    customOptions?: JobsOptions
  ) {
    return this.addJob(JOB_TYPES.NIGHTLY_METRICS_PRECOMPUTE, payload, customOptions);
  }

  /**
   * Generic job enqueuing supporting both BullMQ live Redis and mocked in-memory store.
   */
  public async addJob<T>(name: string, data: T, options?: JobsOptions) {
    const jobOpts = { ...DEFAULT_JOB_OPTIONS, ...options };

    if (this.queue && !this.isMockMode) {
      const job = await this.queue.add(name, data, jobOpts);
      logger.info({
        event: 'job.enqueued',
        jobId: job.id,
        jobName: name,
        attempts: jobOpts.attempts,
      });
      return { id: job.id!, name, data, isMock: false };
    }

    // Mock mode
    const mockId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const mockRecord: JobRecord<T> = {
      id: mockId,
      name,
      data,
      timestamp: Date.now(),
      attemptsMade: 0,
      status: 'enqueued',
    };
    this.inMemoryQueue.push(mockRecord as JobRecord);

    logger.info({
      event: 'job.enqueued_mock',
      jobId: mockId,
      jobName: name,
      attempts: jobOpts.attempts,
    });

    return { id: mockId, name, data, isMock: true };
  }

  /**
   * Retrieves enqueued jobs for inspection and test assertions.
   */
  getMockJobs(): JobRecord[] {
    return [...this.inMemoryQueue];
  }

  clearMockJobs(): void {
    this.inMemoryQueue = [];
  }

  getBullQueue(): Queue | null {
    return this.queue;
  }

  getRedisConnection(): Redis | null {
    return this.redisConnection;
  }

  async close(): Promise<void> {
    if (this.queue) {
      await this.queue.close();
    }
    if (this.redisConnection) {
      await this.redisConnection.quit().catch(() => {});
    }
  }
}

export const jobQueue = new OperationalJobQueue();
