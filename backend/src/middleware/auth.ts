import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../database/connection';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Define user type
export interface UserPayload {
  id: number;
  email: string;
  role: 'student' | 'pedagogue' | 'admin';
  student_id?: number;
  pedagogue_id?: number;
}

// Extend Express Request type to include user
export interface AuthRequest extends Request {
  user?: any; // Use any to avoid conflicts with Express.User
  authUser?: UserPayload;
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      email: string;
      role: 'student' | 'pedagogue' | 'admin';
    };

    // Fetch user from database
    const userResult = await pool.query(
      'SELECT id, email, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const user = userResult.rows[0];

    // Check if user is active
    if (!user.is_active) {
      res.status(403).json({ error: 'Account is deactivated' });
      return;
    }

    // Attach user to request
    req.authUser = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    // If student, get student_id
    if (user.role === 'student') {
      const studentResult = await pool.query(
        'SELECT id FROM students WHERE user_id = $1',
        [user.id]
      );
      if (studentResult.rows.length > 0) {
        req.authUser.student_id = studentResult.rows[0].id;
      }
    }

    // If pedagogue, get pedagogue_id
    if (user.role === 'pedagogue') {
      const pedagogueResult = await pool.query(
        'SELECT id FROM pedagogues WHERE user_id = $1',
        [user.id]
      );
      if (pedagogueResult.rows.length > 0) {
        req.authUser.pedagogue_id = pedagogueResult.rows[0].id;
      }
    }

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Middleware to check if user has specific role
 */
export const authorize = (...allowedRoles: Array<'student' | 'pedagogue' | 'admin'>) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!allowedRoles.includes(req.authUser.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token, continue without user
      next();
      return;
    }

    // Try to authenticate, but don't fail if it doesn't work
    await authenticate(req, res, next);
  } catch (error) {
    // Continue without authentication
    next();
  }
};
