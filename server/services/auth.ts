import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User } from '@shared/schema';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable must be set');
}
const JWT_EXPIRES_IN = '7d';
const SALT_ROUNDS = 12;

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, SALT_ROUNDS);
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  static generateToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  static extractTokenFromHeader(authorization?: string): string | null {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return null;
    }
    return authorization.substring(7);
  }

  static isAdmin(user: JWTPayload): boolean {
    return user.role === 'admin';
  }

  static generatePasswordResetToken(userId: string): string {
    return jwt.sign({ userId, type: 'password-reset' }, JWT_SECRET, { expiresIn: '1h' });
  }

  static verifyPasswordResetToken(token: string): { userId: string } {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as any;
      if (payload.type !== 'password-reset') {
        throw new Error('Invalid token type');
      }
      return { userId: payload.userId };
    } catch (error) {
      throw new Error('Invalid or expired password reset token');
    }
  }
}
