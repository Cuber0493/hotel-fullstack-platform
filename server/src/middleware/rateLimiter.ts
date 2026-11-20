import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

/**
 * Rate limiter specifically protecting sensitive authentication endpoints (/login, /register)
 * against brute-force attacks.
 * In testing environment, skips rate limiting to allow fast parallel test execution.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  handler: (_req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts. Please try again in 15 minutes.',
      },
    });
  },
});
