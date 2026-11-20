import { Request, Response } from 'express';
import { env } from '../config/env.js';

export const getHealth = (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    brand: 'The Bombay Reserve',
    environment: env.NODE_ENV,
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
};
