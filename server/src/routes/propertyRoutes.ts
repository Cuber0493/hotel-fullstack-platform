import { Router, Request, Response, NextFunction } from 'express';
import { propertyService } from '../services/propertyService.js';
import { validateQuery } from '../middleware/validate.js';
import { propertyQuerySchema, availabilityQuerySchema } from '../schemas/hotelSchemas.js';

export const propertyRouter = Router();

propertyRouter.get(
  '/',
  validateQuery(propertyQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const properties = await propertyService.listProperties(req.query);
      res.status(200).json({ properties, total: properties.length });
    } catch (err) {
      next(err);
    }
  }
);

propertyRouter.get(
  '/:slug',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const property = await propertyService.getPropertyBySlug(req.params.slug);
      res.status(200).json({ property });
    } catch (err) {
      next(err);
    }
  }
);

propertyRouter.get(
  '/:slug/availability',
  validateQuery(availabilityQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { checkInDate, checkOutDate, guests } = req.query as unknown as {
        checkInDate: string;
        checkOutDate: string;
        guests?: number;
      };
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const results = await propertyService.checkAvailability(
        req.params.slug,
        checkIn,
        checkOut,
        guests ? Number(guests) : 1
      );
      res.status(200).json({
        propertySlug: req.params.slug,
        checkInDate,
        checkOutDate,
        roomTypes: results,
      });
    } catch (err) {
      next(err);
    }
  }
);
