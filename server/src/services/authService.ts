import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto, { randomUUID, randomBytes } from 'crypto';
import { dataStore, UserEntity, RefreshTokenEntity } from '../repositories/dataStore.js';
import { RegisterInput, LoginInput } from '../schemas/authSchemas.js';
import { ConflictError, UnauthorizedError, NotFoundError } from '../errors/AppError.js';
import { logAuthEvent } from '../lib/logger.js';
import { env } from '../config/env.js';
import { Role } from '@prisma/client';

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
  public generateAccessToken(user: UserEntity): string {
    const secret: jwt.Secret = env.JWT_SECRET;
    const displayName = user.name || user.fullName || '';
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
   * Generates a cryptographically strong refresh token and stores its SHA-256 hash.
   */
  public generateRefreshToken(userId: string): { rawToken: string; expiresAt: Date } {
    const rawToken = randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + env.JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

    const refreshTokenEntity: RefreshTokenEntity = {
      id: `rt-${randomUUID()}`,
      userId,
      tokenHash,
      expiresAt,
      revokedAt: null,
      createdAt: new Date(),
    };

    dataStore.refreshTokens.push(refreshTokenEntity);

    return { rawToken, expiresAt };
  }

  async register(input: RegisterInput, ip?: string) {
    const existing = dataStore.users.find(
      (u) => u.email.toLowerCase() === input.email.toLowerCase()
    );

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
    const newUser: UserEntity = {
      id: `usr-${randomUUID()}`,
      email: input.email.toLowerCase(),
      passwordHash,
      name: displayName,
      fullName: displayName,
      phone: input.phone || null,
      role: Role.GUEST, // Public registration strictly creates GUEST users only
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dataStore.users.push(newUser);

    logAuthEvent('register', {
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      ip,
    });

    const accessToken = this.generateAccessToken(newUser);
    const refreshToken = this.generateRefreshToken(newUser.id);

    return {
      user: this.sanitizeUser(newUser),
      accessToken,
      refreshToken: refreshToken.rawToken,
      token: accessToken, // for backward compatibility with existing tests
    };
  }

  async login(input: LoginInput, ip?: string) {
    const user = dataStore.users.find(
      (u) => u.email.toLowerCase() === input.email.toLowerCase()
    );

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
    const refreshToken = this.generateRefreshToken(user.id);

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
    const storedToken = dataStore.refreshTokens.find((t) => t.tokenHash === tokenHash);

    if (!storedToken) {
      logAuthEvent('failed', {
        reason: 'Refresh token not found',
        ip,
      });
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Reuse detection: If token was already revoked, revoke all tokens for this user
    if (storedToken.revokedAt) {
      dataStore.refreshTokens
        .filter((t) => t.userId === storedToken.userId)
        .forEach((t) => {
          if (!t.revokedAt) t.revokedAt = new Date();
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
      storedToken.revokedAt = new Date();
      logAuthEvent('failed', {
        userId: storedToken.userId,
        reason: 'Refresh token expired',
        ip,
      });
      throw new UnauthorizedError('Refresh token expired');
    }

    // Revoke the consumed token (token rotation)
    storedToken.revokedAt = new Date();

    const user = dataStore.users.find((u) => u.id === storedToken.userId);
    if (!user) {
      throw new UnauthorizedError('User account not found');
    }

    const accessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateRefreshToken(user.id);

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
      const storedToken = dataStore.refreshTokens.find((t) => t.tokenHash === tokenHash);
      if (storedToken) {
        storedToken.revokedAt = new Date();
      }
      logAuthEvent('logout', {
        userId: storedToken?.userId || userId,
        ip,
      });
    } else if (userId) {
      dataStore.refreshTokens
        .filter((t) => t.userId === userId)
        .forEach((t) => {
          if (!t.revokedAt) t.revokedAt = new Date();
        });
      logAuthEvent('logout', { userId, ip });
    }

    return { message: 'Successfully logged out' };
  }

  async getCurrentUser(userId: string) {
    const user = dataStore.users.find((u) => u.id === userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }
    return this.sanitizeUser(user);
  }

  private sanitizeUser(user: UserEntity) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...rest } = user;
    return rest;
  }
}

export const authService = new AuthService();
