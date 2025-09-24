import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database.js';
import type { User } from '../types/index.js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: Pick<User, 'id' | 'email' | 'created_at'> & { name?: string };
    }
  }
}

interface JWTPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

/**
 * JWT Authentication middleware
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Debug logging
  console.log('🔐 Authentication Debug:');
  console.log('  Request path:', req.path);
  console.log('  Authorization header:', req.headers['authorization']);

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  console.log('  Extracted token:', token ? `${token.substring(0, 20)}...` : 'null');

  if (!token) {
    console.log('  ❌ Authentication failed: No token provided');
    res.status(401).json({
      success: false,
      error: 'Access token required'
    });
    return;
  }

  try {
    console.log('  🔑 Verifying JWT token...');
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    console.log('  ✅ JWT verified, userId:', decoded.userId);

    // Get user from database to ensure they still exist
    console.log('  🔍 Looking up user in database...');
    const result = await query<Pick<User, 'id' | 'email' | 'created_at'> & { name?: string }>(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      console.log('  ❌ Authentication failed: User not found in database');
      res.status(401).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    console.log('  ✅ User found:', result.rows[0]?.email);
    req.user = result.rows[0];
    console.log('  ✅ Authentication successful!');
    next();
  } catch (error) {
    console.log('  ❌ Authentication error:', error instanceof Error ? error.name : 'Unknown', error instanceof Error ? error.message : 'Unknown error');
    
    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        console.log('  ❌ Token expired');
        res.status(401).json({
          success: false,
          error: 'Token expired'
        });
        return;
      } else if (error.name === 'JsonWebTokenError') {
        console.log('  ❌ Invalid JWT token');
        res.status(401).json({
          success: false,
          error: 'Invalid token'
        });
        return;
      }
    }
    
    console.error('  ❌ Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = undefined;
    next();
    return;
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      req.user = undefined;
      next();
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    const result = await query<Pick<User, 'id' | 'email' | 'created_at'> & { name?: string }>(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [decoded.userId]
    );

    req.user = result.rows.length > 0 ? result.rows[0] : undefined;
  } catch (error) {
    req.user = undefined;
  }

  next();
};

/**
 * Generate JWT token
 */
export const generateToken = (userId: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured');
  }

  return jwt.sign(
    { userId },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
  );
};

/**
 * Refresh token validation
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // For now, we'll use the same token validation
  // In production, you might want separate refresh tokens
  await authenticateToken(req, res, next);
};