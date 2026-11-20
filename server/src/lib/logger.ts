import pino from 'pino';
import { pinoHttp } from 'pino-http';
import { randomUUID } from 'crypto';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'passwordHash', 'token'],
    censor: '[REDACTED]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => (req.headers['x-request-id'] as string) || randomUUID(),
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
});

// Structured Event Loggers as specified in standing rules
export const logAuthEvent = (
  event: 'login' | 'logout' | 'register' | 'refresh' | 'failed',
  details: { userId?: string; email?: string; role?: string; ip?: string; reason?: string }
) => {
  logger.info({ event: `auth.${event}`, ...details }, `Auth Event: ${event.toUpperCase()}`);
};

export const logBookingEvent = (
  event: 'created' | 'checked_in' | 'checked_out' | 'cancelled',
  details: {
    bookingId?: string;
    bookingCode?: string;
    propertySlug?: string;
    guestEmail?: string;
    amount?: number;
    reason?: string;
  }
) => {
  logger.info({ event: `booking.${event}`, ...details }, `Booking Event: ${event.toUpperCase()}`);
};

export const logEnquiryEvent = (
  event: 'created' | 'status_updated',
  details: {
    enquiryId?: string;
    propertyId?: string | null;
    eventType?: string;
    status?: string;
    email?: string;
  }
) => {
  logger.info({ event: `enquiry.${event}`, ...details }, `Enquiry Event: ${event.toUpperCase()}`);
};

export const logErrorEvent = (err: Error, context?: Record<string, unknown>) => {
  logger.error({ err, ...context }, `System Error: ${err.message}`);
};
