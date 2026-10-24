import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel, IUser } from '../models/User';
import { isDbConnected } from '../config/db';

export interface AuthRequest extends Request {
  user?: IUser;
}

const STAFF_ROLES: IUser['role'][] = [
  'super_admin',
  'admin',
  'order_manager',
  'inventory_manager',
  'catalog_manager',
  'customer_support',
  'finance',
];

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  }
  return secret;
}

export function assertAuthConfig(): void {
  getJwtSecret();
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, getJwtSecret());
    if (typeof decoded === 'string' || typeof decoded.id !== 'string') {
      return res.status(401).json({ error: 'Invalid or expired authentication token.' });
    }

    if (!isDbConnected()) {
      return res.status(503).json({ error: 'Authentication is unavailable until persistent storage is connected.' });
    }
    const user = await UserModel.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'User account not found or session expired.' });
    }
    const tokenVersion =
      typeof decoded.tokenVersion === 'number' && Number.isSafeInteger(decoded.tokenVersion)
        ? decoded.tokenVersion
        : 0;
    if (tokenVersion !== user.tokenVersion) {
      return res.status(401).json({ error: 'Authentication session has been revoked.' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, getJwtSecret());
      if (typeof decoded === 'string' || typeof decoded.id !== 'string') {
        return next();
      }
      if (isDbConnected()) {
        const user = await UserModel.findById(decoded.id).select('-password');
        const tokenVersion =
          typeof decoded.tokenVersion === 'number' && Number.isSafeInteger(decoded.tokenVersion)
            ? decoded.tokenVersion
            : 0;
        if (user && user.tokenVersion === tokenVersion) req.user = user;
      }
    }
  } catch {
    // Continue as guest
  }
  next();
};

export const requireStaff = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): any => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  if (!STAFF_ROLES.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access forbidden: Staff permissions required.' });
  }

  next();
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): any => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role) && req.user.role !== 'super_admin') {
      return res.status(403).json({
        error: `Access forbidden: Requires one of [${roles.join(', ')}] permissions.`,
      });
    }

    next();
  };
};

export const generateToken = (userId: string, role: string, tokenVersion = 0): string => {
  return jwt.sign({ id: userId, role, tokenVersion }, getJwtSecret(), {
    expiresIn: '7d',
  });
};
