import { z } from 'zod';
import { Role } from '@prisma/client';

export const registerSchema = z
  .object({
    email: z.string().email('Please provide a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
    phone: z.string().optional(),
    role: z.nativeEnum(Role).optional().default(Role.GUEST),
  })
  .refine((data) => Boolean(data.name || data.fullName), {
    message: 'Name or fullName is required and must be at least 2 characters',
    path: ['fullName'],
  });

export const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const logoutSchema = z.object({
  refreshToken: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
