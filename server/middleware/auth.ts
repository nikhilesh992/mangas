import { Request, Response, NextFunction } from 'express';
import { AuthService, JWTPayload } from '../services/auth';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = AuthService.extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const user = AuthService.verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!AuthService.isAdmin(req.user)) {
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = AuthService.extractTokenFromHeader(req.headers.authorization);

  if (token) {
    try {
      const user = AuthService.verifyToken(token);
      req.user = user;
    } catch (error) {
      // Token is invalid, but we continue without authentication
    }
  }

  next();
}
