import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UnauthorizedError, ForbiddenError } from '../errors/AppError.js';
import { Role } from '@prisma/client';

export interface AuthUserPayload {
  userId: string;
  email: string;
  name?: string;
  fullName?: string;
  role: Role;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or malformed Authorization header'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUserPayload;
    req.user = decoded;
    next();
  } catch (err) {
    next(new UnauthorizedError('Invalid or expired authentication token'));
  }
};

export const optionalAuthenticate = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUserPayload;
    req.user = decoded;
  } catch {
    // Ignore error for optional authentication
  }
  next();
};

export const requireRoles = (...allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError(`Access requires one of: ${allowedRoles.join(', ')}`));
    }

    next();
  };
};
