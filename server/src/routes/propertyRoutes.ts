import { Router, Request, Response, NextFunction } from 'express';
import { propertyService } from '../services/propertyService.js';
import { uploadService, uploadSingleImage } from '../services/uploadService.js';
import { validateQuery, validateBody } from '../middleware/validate.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  propertyQuerySchema,
  availabilityQuerySchema,
  createPropertySchema,
  updatePropertySchema,
  createRoomSchema,
} from '../schemas/hotelSchemas.js';
import { Role } from '@prisma/client';

export const propertyRouter = Router();

// -------------------------------------------------------------
// Public Endpoints
// -------------------------------------------------------------

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
  '/:id/rooms',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rooms = await propertyService.getPropertyRooms(req.params.id);
      res.status(200).json({ rooms, count: rooms.length });
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

propertyRouter.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const property = await propertyService.getPropertyByIdOrSlug(req.params.id);
      res.status(200).json({ property });
    } catch (err) {
      next(err);
    }
  }
);

// -------------------------------------------------------------
// Admin-Only Endpoints
// -------------------------------------------------------------

propertyRouter.post(
  '/',
  authenticate,
  requireRole(Role.ADMIN),
  validateBody(createPropertySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const property = await propertyService.createProperty(req.body, req.user?.userId);
      res.status(201).json({
        property,
        message: 'Property created successfully',
      });
    } catch (err) {
      next(err);
    }
  }
);

propertyRouter.patch(
  '/:id',
  authenticate,
  requireRole(Role.ADMIN),
  validateBody(updatePropertySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const property = await propertyService.updateProperty(
        req.params.id,
        req.body,
        req.user?.userId
      );
      res.status(200).json({
        property,
        message: 'Property updated successfully',
      });
    } catch (err) {
      next(err);
    }
  }
);

propertyRouter.delete(
  '/:id',
  authenticate,
  requireRole(Role.ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await propertyService.deleteProperty(req.params.id, req.user?.userId);
      res.status(200).json({
        success: true,
        id: result.id,
        message: 'Property deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }
);

propertyRouter.post(
  '/:id/rooms',
  authenticate,
  requireRole(Role.ADMIN),
  validateBody(createRoomSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const room = await propertyService.addRoom(req.params.id, req.body);
      res.status(201).json({
        room,
        message: 'Room inventory added successfully',
      });
    } catch (err) {
      next(err);
    }
  }
);

propertyRouter.post(
  '/:id/images',
  authenticate,
  requireRole(Role.ADMIN),
  uploadSingleImage,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const property = await propertyService.getPropertyByIdOrSlug(req.params.id);
      const uploadResult = await uploadService.uploadPropertyImage(
        property.id,
        req.file!,
        req.user?.userId
      );
      const updated = await propertyService.addImage(property.id, uploadResult.url);
      res.status(201).json({
        image: uploadResult,
        property: updated,
        message: 'Property image uploaded successfully',
      });
    } catch (err) {
      next(err);
    }
  }
);
