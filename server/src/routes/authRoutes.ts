import { Router, Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService.js';
import { validateBody } from '../middleware/validate.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { registerSchema, loginSchema } from '../schemas/authSchemas.js';
import { UnauthorizedError, ValidationError } from '../errors/AppError.js';
import { env } from '../config/env.js';

export const authRouter = Router();

const isProduction = env.NODE_ENV === 'production';

export const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    maxAge: env.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
  });
};

export const clearRefreshTokenCookie = (res: Response) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  });
};

authRouter.post(
  '/register',
  authRateLimiter,
  validateBody(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.register(req.body, req.ip);
      setRefreshTokenCookie(res, result.refreshToken);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

authRouter.post(
  '/login',
  authRateLimiter,
  validateBody(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.body, req.ip);
      setRefreshTokenCookie(res, result.refreshToken);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

authRouter.post(
  '/refresh',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body && 'refreshToken' in req.body && req.body.refreshToken === '') {
        throw new ValidationError('Refresh token cannot be empty');
      }

      const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!rawRefreshToken) {
        throw new UnauthorizedError('Missing refresh token');
      }

      const result = await authService.refresh(rawRefreshToken, req.ip);
      setRefreshTokenCookie(res, result.refreshToken);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
);

authRouter.post(
  '/logout',
  optionalAuthenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      const result = await authService.logout(
        rawRefreshToken,
        req.user?.userId,
        req.ip
      );
      clearRefreshTokenCookie(res);
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
