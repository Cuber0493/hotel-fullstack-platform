import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { httpLogger } from './lib/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/authRoutes.js';
import { propertyRouter } from './routes/propertyRoutes.js';
import { bookingRouter } from './routes/bookingRoutes.js';
import { staffRouter } from './routes/staffRoutes.js';
import { enquiryRouter } from './routes/enquiryRoutes.js';
import { getHealth } from './controllers/healthController.js';
import { NotFoundError } from './errors/AppError.js';

export const app: Express = express();

// Security Headers
app.use(helmet());

// CORS Configuration
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

// Body Parsing Middleware
app.use(express.json({ limit: '1mb' }));

// Global Rate Limiter (skip in test environment)
if (env.NODE_ENV !== 'test') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // limit each IP to 300 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP. Please try again after 15 minutes.',
      },
    },
  });
  app.use(limiter);
}

// Structured HTTP Request Logging
if (env.NODE_ENV !== 'test') {
  app.use(httpLogger);
}

// Health Check Endpoint (Direct & under /api)
app.get('/api/health', getHealth);
app.get('/health', getHealth);

// Versioned API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/properties', propertyRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/api/v1/staff', staffRouter);
app.use('/api/v1/enquiries', enquiryRouter);

// Catch-All 404 Route
app.use((req, _res, next) => {
  next(new NotFoundError(`Resource not found: ${req.method} ${req.originalUrl}`));
});

// Centralized Standardized Error Handling Middleware:
// { "error": { "code": string, "message": string, "details"?: any } }
app.use(errorHandler);

export default app;
