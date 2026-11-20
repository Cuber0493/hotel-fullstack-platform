import { Router, Request, Response, NextFunction } from 'express';
import { metricsService } from '../services/metricsService.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateQuery } from '../middleware/validate.js';
import { adminMetricsQuerySchema } from '../schemas/hotelSchemas.js';
import { Role } from '@prisma/client';

export const adminRouter = Router();

// All admin routes require authentication and ADMIN role
adminRouter.use(authenticate, requireRole(Role.ADMIN));

// GET /api/admin/metrics?propertyId=&from=&to=
adminRouter.get(
  '/metrics',
  validateQuery(adminMetricsQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const metrics = metricsService.getMetrics(req.query as any);
      res.status(200).json(metrics);
    } catch (err) {
      next(err);
    }
  }
);
