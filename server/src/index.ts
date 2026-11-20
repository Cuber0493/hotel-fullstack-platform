import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { httpLogger } from './lib/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/authRoutes.js';
import { propertyRouter } from './routes/propertyRoutes.js';
import { bookingRouter } from './routes/bookingRoutes.js';
import { staffRouter } from './routes/staffRoutes.js';
import { enquiryRouter } from './routes/enquiryRoutes.js';
import { NotFoundError } from './errors/AppError.js';

export const app = express();

// Security and utility middleware
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());

// Structured HTTP logging
if (process.env.NODE_ENV !== 'test') {
  app.use(httpLogger);
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    brand: 'The Bombay Reserve',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/properties', propertyRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use('/api/v1/staff', staffRouter);
app.use('/api/v1/enquiries', enquiryRouter);

// Catch-all 404 for undefined routes
app.use((req, _res, next) => {
  next(new NotFoundError(`Resource not found: ${req.method} ${req.originalUrl}`));
});

// Centralized error handler enforcing consistent format:
// { "error": { "code": string, "message": string, "details"?: any } }
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(env.PORT, () => {
    console.log(`[The Bombay Reserve Server] Running on http://localhost:${env.PORT} in ${env.NODE_ENV} mode`);
  });
}
