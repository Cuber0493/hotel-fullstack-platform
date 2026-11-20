import { Router, Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService.js';
import { validateBody } from '../middleware/validate.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
} from '../schemas/authSchemas.js';

export const authRouter = Router();

authRouter.post(
  '/register',
  validateBody(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.register(req.body, req.ip);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

authRouter.post(
  '/login',
  validateBody(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.body, req.ip);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

authRouter.post(
  '/refresh',
  validateBody(refreshTokenSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.refresh(req.body.refreshToken, req.ip);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

authRouter.post(
  '/logout',
  optionalAuthenticate,
  validateBody(logoutSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.logout(
        req.body?.refreshToken,
        req.user?.userId,
        req.ip
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

authRouter.get(
  '/me',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await authService.getCurrentUser(req.user!.userId);
      res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  }
);
