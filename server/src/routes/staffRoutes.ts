import { Router, Request, Response, NextFunction } from 'express';
import { bookingService } from '../services/bookingService.js';
import { enquiryService } from '../services/enquiryService.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import {
  staffBookingsQuerySchema,
  updateBookingStatusSchema,
  updateEnquiryStatusSchema,
} from '../schemas/hotelSchemas.js';
import { Role } from '@prisma/client';

export const staffRouter = Router();

// All staff endpoints require authentication with STAFF or ADMIN role
staffRouter.use(authenticate, requireRoles(Role.STAFF, Role.ADMIN));

staffRouter.get(
  '/dashboard',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const dashboard = await bookingService.getStaffDashboard();
      res.status(200).json(dashboard);
    } catch (err) {
      next(err);
    }
  }
);

staffRouter.get(
  '/bookings',
  validateQuery(staffBookingsQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookings = await bookingService.listStaffBookings(req.query as any);
      res.status(200).json({ bookings, count: bookings.length });
    } catch (err) {
      next(err);
    }
  }
);

staffRouter.patch(
  '/bookings/:id/status',
  validateBody(updateBookingStatusSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, roomId, cancellationReason } = req.body;
      const updated = await bookingService.updateBookingStatus(
        req.params.id,
        status,
        roomId,
        cancellationReason
      );
      res.status(200).json({
        booking: updated,
        message: `Booking status updated to ${status}`,
      });
    } catch (err) {
      next(err);
    }
  }
);

staffRouter.get(
  '/occupancy-grid',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const propertySlug = req.query.propertySlug as string | undefined;
      const days = req.query.days ? Number(req.query.days) : 14;
      const occupancy = await bookingService.getOccupancyGrid(propertySlug, days);
      res.status(200).json(occupancy);
    } catch (err) {
      next(err);
    }
  }
);

staffRouter.get(
  '/enquiries',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = req.query.status as any;
      const enquiries = await enquiryService.listEnquiries(status);
      res.status(200).json({ enquiries, count: enquiries.length });
    } catch (err) {
      next(err);
    }
  }
);

staffRouter.patch(
  '/enquiries/:id',
  validateBody(updateEnquiryStatusSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await enquiryService.updateEnquiryStatus(req.params.id, req.body);
      res.status(200).json({
        enquiry: updated,
        message: 'Enquiry updated successfully',
      });
    } catch (err) {
      next(err);
    }
  }
);
