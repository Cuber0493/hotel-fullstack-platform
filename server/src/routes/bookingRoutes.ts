import { Router, Request, Response, NextFunction } from 'express';
import { bookingService } from '../services/bookingService.js';
import { validateBody } from '../middleware/validate.js';
import { optionalAuthenticate, authenticate, requireRole } from '../middleware/auth.js';
import { createBookingSchema, cancelBookingSchema } from '../schemas/hotelSchemas.js';
import { Role } from '@prisma/client';

export const bookingRouter = Router();

// Create booking (Guests can book without login or authenticated)
bookingRouter.post(
  '/',
  optionalAuthenticate,
  validateBody(createBookingSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user ? req.user.userId : null;
      const booking = await bookingService.createBooking(req.body, userId);
      res.status(201).json({
        booking,
        message: 'Reservation confirmed successfully',
      });
    } catch (err) {
      next(err);
    }
  }
);

// Admin view all bookings
bookingRouter.get(
  '/',
  authenticate,
  requireRole(Role.ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookings = await bookingService.listStaffBookings(req.query as any);
      res.status(200).json({ bookings, count: bookings.length });
    } catch (err) {
      next(err);
    }
  }
);

// Guest view their own bookings
bookingRouter.get(
  '/my',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookings = await bookingService.getUserBookings(req.user!.userId);
      res.status(200).json({ bookings, count: bookings.length });
    } catch (err) {
      next(err);
    }
  }
);

bookingRouter.get(
  '/my-bookings',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookings = await bookingService.getUserBookings(req.user!.userId);
      res.status(200).json({ bookings, count: bookings.length });
    } catch (err) {
      next(err);
    }
  }
);

// View single booking: Guests can view their own; Admins can view any
bookingRouter.get(
  '/:id',
  optionalAuthenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const booking = await bookingService.getBookingById(req.params.id, req.user);
      res.status(200).json({ booking });
    } catch (err) {
      next(err);
    }
  }
);

// Cancel booking: Guests can cancel their own; Admins can cancel any
bookingRouter.patch(
  '/:id/cancel',
  optionalAuthenticate,
  validateBody(cancelBookingSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const role = req.user?.role;
      const cancelled = await bookingService.cancelBooking(
        req.params.id,
        req.body.reason,
        userId,
        role
      );
      res.status(200).json({
        booking: cancelled,
        message: 'Reservation cancelled successfully',
      });
    } catch (err) {
      next(err);
    }
  }
);
