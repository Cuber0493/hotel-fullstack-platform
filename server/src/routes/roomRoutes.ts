import { Router, Request, Response, NextFunction } from 'express';
import { searchService } from '../services/searchService.js';
import { validateQuery } from '../middleware/validate.js';
import { roomSearchQuerySchema } from '../schemas/hotelSchemas.js';

export const roomRouter = Router();

// GET /api/rooms/search
roomRouter.get(
  '/search',
  validateQuery(roomSearchQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await searchService.searchRooms(req.query as any);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);
