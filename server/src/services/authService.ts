import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { dataStore, UserEntity } from '../repositories/dataStore.js';
import { RegisterInput, LoginInput } from '../schemas/authSchemas.js';
import { ConflictError, UnauthorizedError, NotFoundError } from '../errors/AppError.js';
import { logAuthEvent } from '../lib/logger.js';
import { env } from '../config/env.js';
import { Role } from '@prisma/client';

export class AuthService {
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
    const newUser: UserEntity = {
      id: `usr-${randomUUID()}`,
      email: input.email.toLowerCase(),
      passwordHash,
      fullName: input.fullName,
      phone: input.phone || null,
      role: input.role || Role.GUEST,
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

    const token = this.generateToken(newUser);
    return {
      user: this.sanitizeUser(newUser),
      token,
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

    const token = this.generateToken(user);
    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async getCurrentUser(userId: string) {
    const user = dataStore.users.find((u) => u.id === userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }
    return this.sanitizeUser(user);
  }

  private generateToken(user: UserEntity): string {
    const secret: jwt.Secret = env.JWT_SECRET;
    const signOptions: jwt.SignOptions = {
      expiresIn: '7d',
    };
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      secret,
      signOptions
    );
  }

  private sanitizeUser(user: UserEntity) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...rest } = user;
    return rest;
  }
}

export const authService = new AuthService();
