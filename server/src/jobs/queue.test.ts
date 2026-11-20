import { describe, it, expect, vi, beforeEach } from 'vitest';
import { jobQueue, JOB_TYPES, DEFAULT_JOB_OPTIONS } from './queue.js';
import { executeJobTask } from './worker.js';
import { emailService } from '../services/emailService.js';
import { metricsService } from '../services/metricsService.js';

describe('Phase 11 (Stretch): BullMQ Job Queue & Operational Worker', () => {
  beforeEach(() => {
    jobQueue.clearMockJobs();
    vi.restoreAllMocks();
  });

  describe('1. Queue Enqueuing & Default Options', () => {
    it('enforces exponential backoff and retry settings on default options', () => {
      expect(DEFAULT_JOB_OPTIONS.attempts).toBe(3);
      expect(DEFAULT_JOB_OPTIONS.backoff).toEqual({
        type: 'exponential',
        delay: 2000,
      });
      expect(DEFAULT_JOB_OPTIONS.removeOnComplete).toEqual({ count: 100 });
      expect(DEFAULT_JOB_OPTIONS.removeOnFail).toEqual({ count: 500 });
    });

    it('enqueues booking confirmation email with complete reservation payload', async () => {
      const payload = {
        bookingId: 'bk-test-123',
        bookingCode: 'TBR-BOM-992144',
        guestName: 'Ananya Birla',
        guestEmail: 'ananya@example.com',
        propertyName: 'The Colaba Colonial',
        roomTypeName: 'Heritage Grand Suite',
        checkIn: '2026-12-15',
        checkOut: '2026-12-18',
        nights: 3,
        totalInr: 135000,
        specialRequests: 'Sea facing room',
      };

      const result = await jobQueue.enqueueBookingConfirmation(payload);

      expect(result.name).toBe(JOB_TYPES.BOOKING_CONFIRMATION);
      expect(result.data).toEqual(payload);

      const mockJobs = jobQueue.getMockJobs();
      expect(mockJobs.length).toBe(1);
      expect(mockJobs[0].name).toBe(JOB_TYPES.BOOKING_CONFIRMATION);
      expect(mockJobs[0].data).toEqual(payload);
    });

    it('enqueues admin notification for bespoke event enquiry', async () => {
      const payload = {
        enquiryId: 'enq-test-456',
        name: 'Zubin Mehta',
        email: 'zubin@classical.in',
        propertyName: 'The Colaba Colonial',
        message: 'Looking for private heritage courtyard dinner for 40 guests.',
      };

      const result = await jobQueue.enqueueEnquiryNotification(payload);

      expect(result.name).toBe(JOB_TYPES.ENQUIRY_NOTIFICATION);
      expect(result.data).toEqual(payload);

      const mockJobs = jobQueue.getMockJobs();
      expect(mockJobs.length).toBe(1);
      expect(mockJobs[0].data).toEqual(payload);
    });

    it('enqueues nightly metrics precomputation job', async () => {
      const payload = { date: '2026-11-20' };
      const result = await jobQueue.enqueueNightlyMetricsPrecompute(payload);

      expect(result.name).toBe(JOB_TYPES.NIGHTLY_METRICS_PRECOMPUTE);
      expect(result.data).toEqual(payload);
    });
  });

  describe('2. Worker Process Task Execution', () => {
    it('executes booking-confirmation task and dispatches luxury email', async () => {
      const sendEmailSpy = vi
        .spyOn(emailService, 'sendBookingConfirmation')
        .mockResolvedValue({ messageId: 'msg-test-1', success: true });

      const payload = {
        bookingId: 'bk-100',
        bookingCode: 'TBR-BOM-100100',
        guestName: 'Karan Johar',
        guestEmail: 'karan@example.com',
        propertyName: 'Bandra Bohemian Villa',
        roomTypeName: 'Artisan Suite',
        checkIn: '2026-12-01',
        checkOut: '2026-12-03',
        nights: 2,
        totalInr: 90000,
      };

      const result = await executeJobTask(JOB_TYPES.BOOKING_CONFIRMATION, payload, 'job-task-1');

      expect(sendEmailSpy).toHaveBeenCalledTimes(1);
      expect(sendEmailSpy).toHaveBeenCalledWith(payload);
      expect(result.success).toBe(true);
      expect(result.jobId).toBe('job-task-1');
    });

    it('executes enquiry-notification task and sends alert to admin', async () => {
      const sendEnquirySpy = vi
        .spyOn(emailService, 'sendEnquiryNotification')
        .mockResolvedValue({ messageId: 'msg-enq-test-1', success: true });

      const payload = {
        enquiryId: 'enq-999',
        name: 'Natasha Poonawalla',
        email: 'natasha@example.com',
        propertyName: 'Marine Drive Bayview',
        message: 'Annual venture partner pre-dinner cocktails on private rooftop.',
      };

      const result = await executeJobTask(JOB_TYPES.ENQUIRY_NOTIFICATION, payload, 'job-task-2');

      expect(sendEnquirySpy).toHaveBeenCalledTimes(1);
      expect(sendEnquirySpy).toHaveBeenCalledWith(payload);
      expect(result.success).toBe(true);
    });

    it('executes nightly-metrics-precompute task and broadcasts digest email', async () => {
      const mockMetrics = {
        overall: {
          occupancyRate: 0.8,
          adr: 42000,
          revpar: 33600,
          totalRevenueInr: 3360000,
          roomNightsSold: 80,
          roomNightsAvailable: 100,
        },
        byProperty: [],
        dailyTrend: [],
      };

      vi.spyOn(metricsService, 'getMetrics').mockResolvedValue(mockMetrics as any);
      const digestSpy = vi
        .spyOn(emailService, 'sendMetricsDigest')
        .mockResolvedValue({ messageId: 'msg-digest-1', success: true });

      const result = await executeJobTask(
        JOB_TYPES.NIGHTLY_METRICS_PRECOMPUTE,
        { date: '2026-11-20' },
        'job-task-3'
      );

      expect(digestSpy).toHaveBeenCalledTimes(1);
      expect(digestSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          date: '2026-11-20',
          occupancyRate: 0.8,
          adr: 42000,
          revpar: 33600,
        })
      );
      expect(result.success).toBe(true);
    });

    it('handles task failure and re-throws error for BullMQ exponential backoff retry', async () => {
      vi.spyOn(emailService, 'sendBookingConfirmation').mockRejectedValue(
        new Error('SMTP Transport Network Timeout')
      );

      await expect(
        executeJobTask(
          JOB_TYPES.BOOKING_CONFIRMATION,
          { bookingCode: 'FAIL-123' } as any,
          'job-fail-1'
        )
      ).rejects.toThrow('SMTP Transport Network Timeout');
    });

    it('rejects unknown job names with an explanatory error', async () => {
      await expect(
        executeJobTask('UNKNOWN_UNREGISTERED_JOB', {}, 'job-unknown')
      ).rejects.toThrow('Unrecognized job type: UNKNOWN_UNREGISTERED_JOB');
    });
  });
});
