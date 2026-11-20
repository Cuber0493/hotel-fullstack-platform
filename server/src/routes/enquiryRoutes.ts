import { Router, Request, Response, NextFunction } from 'express';
import { enquiryService } from '../services/enquiryService.js';
import { jobQueue } from '../jobs/queue.js';
import { validateBody } from '../middleware/validate.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { createEnquirySchema, updateEnquiryStatusSchema } from '../schemas/hotelSchemas.js';
import { Role } from '@prisma/client';

export const enquiryRouter = Router();

// Anyone can submit an enquiry (public)
enquiryRouter.post(
  '/',
  validateBody(createEnquirySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const enquiry = await enquiryService.createEnquiry(req.body);

      // Asynchronously dispatch admin alert notification via BullMQ queue
      jobQueue.enqueueEnquiryNotification({
        enquiryId: enquiry.id,
        name: enquiry.name,
        email: enquiry.email,
        propertyName: (enquiry as any).propertyName || 'The Bombay Reserve',
        message: enquiry.message,
      }).catch(() => {});

      res.status(201).json({
        enquiry,
        message: 'Your enquiry has been received. Our concierge team will contact you within 24 hours.',
      });
    } catch (err) {
      next(err);
    }
  }
);

// Admin only: view enquiries
enquiryRouter.get(
  '/',
  authenticate,
  requireRole(Role.ADMIN),
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

// Admin only: update enquiry status
enquiryRouter.patch(
  '/:id',
  authenticate,
  requireRole(Role.ADMIN),
  validateBody(updateEnquiryStatusSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const enquiry = await enquiryService.updateEnquiryStatus(req.params.id, req.body);
      res.status(200).json({
        enquiry,
        message: 'Enquiry updated successfully',
      });
    } catch (err) {
      next(err);
    }
  }
);
