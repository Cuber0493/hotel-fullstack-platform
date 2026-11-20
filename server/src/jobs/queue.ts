/**
 * Background Job Queue Interface (Stretch: Redis / BullMQ)
 * Handles asynchronous operational tasks:
 * - Sending luxury guest booking confirmation emails
 * - 48h pre-arrival concierge preferences emails
 * - Event enquiry notification to Front-Desk staff
 */

export interface BackgroundJob<T = Record<string, unknown>> {
  id: string;
  name: string;
  data: T;
  createdAt: Date;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

export class JobQueue {
  private queue: BackgroundJob[] = [];

  async addJob<T extends Record<string, unknown>>(name: string, data: T): Promise<BackgroundJob<T>> {
    const job: BackgroundJob<T> = {
      id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name,
      data,
      createdAt: new Date(),
      status: 'PENDING',
    };

    this.queue.push(job as BackgroundJob);

    // Simulate async stretch queue processing
    setTimeout(() => {
      job.status = 'COMPLETED';
    }, 100);

    return job;
  }

  getJobs(): BackgroundJob[] {
    return this.queue;
  }
}

export const jobQueue = new JobQueue();
