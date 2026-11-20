import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { httpLogger } from './lib/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/authRoutes.js';
import { propertyRouter } from './routes/propertyRoutes.js';
import { roomRouter } from './routes/roomRoutes.js';
import { bookingRouter } from './routes/bookingRoutes.js';
import { staffRouter } from './routes/staffRoutes.js';
import { adminRouter } from './routes/adminRoutes.js';
import { enquiryRouter } from './routes/enquiryRoutes.js';
import { docsRouter } from './routes/docsRoutes.js';
import { getHealth } from './controllers/healthController.js';
import { NotFoundError } from './errors/AppError.js';

export const app: Express = express();

// Security Headers
app.use(helmet({
  contentSecurityPolicy: false, // Allow Swagger UI inline scripts & styles
}));

// Gzip / Deflate Response Compression
app.use(compression());

// CORS Configuration - Production & Vercel domain support
const allowedOrigins = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
  : ['http://localhost:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (Postman, curl, server-to-server health checks)
      if (!origin) return callback(null, true);

      // Check explicitly configured origins
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }

      // Allow Vercel preview and production domains for this platform
      if (
        env.NODE_ENV === 'production' &&
        (/^https:\/\/([a-z0-9-]+)\.vercel\.app$/i.test(origin) ||
          /^https:\/\/the-bombay-reserve.*\.vercel\.app$/i.test(origin))
      ) {
        return callback(null, true);
      }

      // Allow localhost on any port in development and test environments
      if (
        env.NODE_ENV !== 'production' &&
        /^http:\/\/localhost:[0-9]+$/i.test(origin)
      ) {
        return callback(null, true);
      }

      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body Parsing Middleware
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

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

// Interactive OpenAPI / Swagger Documentation
app.use('/api/docs', docsRouter);
app.use('/docs', docsRouter);

// Authentication Routes (Standard /api/auth and versioned /api/v1/auth)
app.use('/api/auth', authRouter);
app.use('/api/v1/auth', authRouter);

// Domain Routes (Mounted under /api and /api/v1)
app.use('/api/properties', propertyRouter);
app.use('/api/v1/properties', propertyRouter);

app.use('/api/rooms', roomRouter);
app.use('/api/v1/rooms', roomRouter);

app.use('/api/bookings', bookingRouter);
app.use('/api/v1/bookings', bookingRouter);

app.use('/api/staff', staffRouter);
app.use('/api/v1/staff', staffRouter);

app.use('/api/admin', adminRouter);
app.use('/api/v1/admin', adminRouter);

app.use('/api/enquiries', enquiryRouter);
app.use('/api/v1/enquiries', enquiryRouter);

// Catch-All 404 Route
app.use((req, _res, next) => {
  next(new NotFoundError(`Resource not found: ${req.method} ${req.originalUrl}`));
});

// Centralized Standardized Error Handling Middleware:
// { "error": { "code": string, "message": string, "details"?: any } }
app.use(errorHandler);

export default app;
