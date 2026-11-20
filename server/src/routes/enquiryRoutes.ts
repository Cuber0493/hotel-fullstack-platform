import { Router, Request, Response, NextFunction } from 'express';
import { enquiryService } from '../services/enquiryService.js';
import { validateBody } from '../middleware/validate.js';
import { createEnquirySchema } from '../schemas/hotelSchemas.js';

export const enquiryRouter = Router();

enquiryRouter.post(
  '/',
  validateBody(createEnquirySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const enquiry = await enquiryService.createEnquiry(req.body);
      res.status(201).json({
        enquiry,
        message: 'Your enquiry has been received. Our concierge team will contact you within 24 hours.',
      });
    } catch (err) {
      next(err);
    }
  }
);
