import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../errors/AppError.js';

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = formatZodError(result.error);
      return next(new ValidationError('Request body validation failed', details));
    }
    req.body = result.data;
    next();
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const details = formatZodError(result.error);
      return next(new ValidationError('Query parameter validation failed', details));
    }
    req.query = result.data;
    next();
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const details = formatZodError(result.error);
      return next(new ValidationError('URL parameter validation failed', details));
    }
    req.params = result.data;
    next();
  };
};

function formatZodError(error: ZodError) {
  return error.errors.map((e) => ({
    field: e.path.join('.'),
    message: e.message,
    code: e.code,
  }));
}
