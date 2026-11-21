import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z
  .object({
    PORT: z.coerce.number().default(4000),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DATABASE_URL: z.string().optional(),
    JWT_SECRET: z.string().min(16).default('the_bombay_reserve_super_secret_jwt_key_2026_secure'),
    JWT_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_DAYS: z.coerce.number().default(7),
    USD_TO_INR_RATE: z.coerce.number().default(86.5),
    ADMIN_EMAIL: z.string().email().default('admin@bombayreserve.com'),
    ADMIN_PASSWORD: z
      .string()
      .min(12, 'ADMIN_PASSWORD must be at least 12 characters')
      .refine((val) => !val.includes('Password@123'), 'Default password "Password@123" is strictly forbidden')
      .default('BombayReserveAdmin2026!'),
    ADMIN_NAME: z.string().default('Anya Mehta'),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    REDIS_URL: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().default('concierge@bombayreserve.com'),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      if (!process.env.ADMIN_PASSWORD) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'ADMIN_PASSWORD is required in production and cannot use a fallback default',
          path: ['ADMIN_PASSWORD'],
        });
      }
      if (
        data.ADMIN_PASSWORD === 'BombayReserveAdmin2026!' ||
        data.ADMIN_PASSWORD.includes('Password@123')
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'ADMIN_PASSWORD cannot use a default development password in production',
          path: ['ADMIN_PASSWORD'],
        });
      }
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  throw new Error('Environment configuration validation failed');
}

export const env = parsed.data;
