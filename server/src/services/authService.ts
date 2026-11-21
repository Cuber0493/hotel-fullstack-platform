import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto, { randomBytes } from 'crypto';
import { prisma } from '../lib/prisma.js';
import { RegisterInput, LoginInput } from '../schemas/authSchemas.js';
import { ConflictError, UnauthorizedError, NotFoundError } from '../errors/AppError.js';
import { logAuthEvent } from '../lib/logger.js';
import { env } from '../config/env.js';
import { Role, User } from '@prisma/client';

export class AuthService {
  /**
   * Hashes a raw refresh token using SHA-256 for secure DB persistence.
   */
  public hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generates a short-lived JWT access token for authenticated API requests.
   */
  public generateAccessToken(user: User): string {
    const secret: jwt.Secret = env.JWT_SECRET;
    const displayName = user.fullName || user.name || '';
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: displayName,
        fullName: displayName,
        role: user.role,
      },
      secret,
      {
        expiresIn: (env.JWT_EXPIRES_IN as any) || '15m',
      }
    );
  }

  /**
   * Generates a cryptographically strong refresh token and persists its SHA-256 hash in Postgres.
   */
  public async generateRefreshToken(userId: string): Promise<{ rawToken: string; expiresAt: Date }> {
    const rawToken = randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + env.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return { rawToken, expiresAt };
  }

  async register(input: RegisterInput, ip?: string) {
    const email = input.email.toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      logAuthEvent('failed', {
        email: input.email,
        reason: 'Email already registered',
        ip,
      });
      throw new ConflictError('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const displayName = input.name || input.fullName || '';
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: displayName,
        fullName: displayName,
        phone: input.phone || null,
        role: Role.GUEST,
      },
    });

    logAuthEvent('register', {
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      ip,
    });

    const accessToken = this.generateAccessToken(newUser);
    const refreshToken = await this.generateRefreshToken(newUser.id);

    return {
      user: this.sanitizeUser(newUser),
      accessToken,
      refreshToken: refreshToken.rawToken,
      token: accessToken, // for backward compatibility with existing tests
    };
  }

  async login(input: LoginInput, ip?: string) {
    const email = input.email.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      logAuthEvent('failed', {
        email: input.email,
        reason: 'User not found',
        ip,
      });
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      logAuthEvent('failed', {
        userId: user.id,
        email: user.email,
        reason: 'Incorrect password',
        ip,
      });
      throw new UnauthorizedError('Invalid email or password');
    }

    logAuthEvent('login', {
      userId: user.id,
      email: user.email,
      role: user.role,
      ip,
    });

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken: refreshToken.rawToken,
      token: accessToken,
    };
  }

  /**
   * Refreshes JWT credentials using refresh token rotation.
   * Revokes the provided token and issues a new access/refresh pair.
   * If a revoked token is reused, family revocation is triggered.
   */
  async refresh(rawRefreshToken: string, ip?: string) {
    const tokenHash = this.hashToken(rawRefreshToken);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!storedToken) {
      logAuthEvent('failed', {
        reason: 'Refresh token not found',
        ip,
      });
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Reuse detection: If token was already revoked, revoke all tokens for this user
    if (storedToken.revokedAt) {
      await prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      logAuthEvent('failed', {
        userId: storedToken.userId,
        reason: 'Refresh token reuse detected',
        ip,
      });

      throw new UnauthorizedError('Invalid refresh token');
    }

    // Check expiration
    if (storedToken.expiresAt.getTime() < Date.now()) {
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });
      logAuthEvent('failed', {
        userId: storedToken.userId,
        reason: 'Refresh token expired',
        ip,
      });
      throw new UnauthorizedError('Refresh token expired');
    }

    // Revoke the consumed token (token rotation)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const user = await prisma.user.findUnique({
      where: { id: storedToken.userId },
    });
    if (!user) {
      throw new UnauthorizedError('User account not found');
    }

    const accessToken = this.generateAccessToken(user);
    const newRefreshToken = await this.generateRefreshToken(user.id);

    logAuthEvent('refresh', {
      userId: user.id,
      email: user.email,
      role: user.role,
      ip,
    });

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken: newRefreshToken.rawToken,
      token: accessToken,
    };
  }

  async logout(rawRefreshToken?: string, userId?: string, ip?: string) {
    if (rawRefreshToken) {
      const tokenHash = this.hashToken(rawRefreshToken);
      const storedToken = await prisma.refreshToken.findUnique({
        where: { tokenHash },
      });
      if (storedToken) {
        await prisma.refreshToken.update({
          where: { id: storedToken.id },
          data: { revokedAt: new Date() },
        });
      }
      logAuthEvent('logout', {
        userId: storedToken?.userId || userId,
        ip,
      });
    } else if (userId) {
      await prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      logAuthEvent('logout', { userId, ip });
    }

    return { message: 'Successfully logged out' };
  }

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundError('User profile not found');
    }
    return this.sanitizeUser(user);
  }

  private sanitizeUser(user: User) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...rest } = user;
    return {
      ...rest,
      fullName: user.fullName || user.name,
    };
  }
}

export const authService = new AuthService();
