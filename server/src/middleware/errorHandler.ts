import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError.js';
import { logErrorEvent } from '../lib/logger.js';

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected server error occurred';
  let details: unknown = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.errorCode;
    message = err.message;
    details = err.details;
  } else if (err.name === 'SyntaxError') {
    statusCode = 400;
    code = 'MALFORMED_JSON';
    message = 'Request payload contains invalid JSON';
  } else {
    logErrorEvent(err, {
      path: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });
  }

  const responsePayload: ApiErrorResponse = {
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
    },
  };

  res.status(statusCode).json(responsePayload);
};
