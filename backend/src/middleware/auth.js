const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

/**
 * JWT Authentication middleware
 */
const authenticateToken = async (req, res, next) => {
  // Debug logging
  console.log('🔐 Authentication Debug:');
  console.log('  Request path:', req.path);
  console.log('  Authorization header:', req.headers['authorization']);

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  console.log('  Extracted token:', token ? `${token.substring(0, 20)}...` : 'null');

  if (!token) {
    console.log('  ❌ Authentication failed: No token provided');
    return res.status(401).json({
      success: false,
      error: 'Access token required'
    });
  }

  try {
    console.log('  🔑 Verifying JWT token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('  ✅ JWT verified, userId:', decoded.userId);

    // Get user from database to ensure they still exist
    console.log('  🔍 Looking up user in database...');
    const result = await query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      console.log('  ❌ Authentication failed: User not found in database');
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log('  ✅ User found:', result.rows[0].email);
    req.user = result.rows[0];
    console.log('  ✅ Authentication successful!');
    next();
  } catch (error) {
    console.log('  ❌ Authentication error:', error.name, error.message);
    if (error.name === 'TokenExpiredError') {
      console.log('  ❌ Token expired');
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    } else if (error.name === 'JsonWebTokenError') {
      console.log('  ❌ Invalid JWT token');
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    } else {
      console.error('  ❌ Auth middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'Authentication error'
      });
    }
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [decoded.userId]
    );

    req.user = result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    req.user = null;
  }

  next();
};

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Refresh token validation
 */
const refreshToken = async (req, res, next) => {
  // For now, we'll use the same token validation
  // In production, you might want separate refresh tokens
  await authenticateToken(req, res, next);
};

module.exports = {
  authenticateToken,
  optionalAuth,
  generateToken,
  refreshToken
};