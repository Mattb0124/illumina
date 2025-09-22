const express = require('express');
const userService = require('../services/userService');
const { authenticateToken } = require('../middleware/auth');
const { userSchemas, validate } = require('../utils/validation');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', validate(userSchemas.register), async (req, res) => {
  try {
    const { email, name, password } = req.body;

    const result = await userService.register(email, name, password);

    res.status(201).json({
      success: true,
      data: result,
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);

    if (error.message === 'User already exists with this email') {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', validate(userSchemas.login), async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await userService.login(email, password);

    res.json({
      success: true,
      data: result,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);

    if (error.message === 'Invalid email or password') {
      return res.status(401).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
router.post('/logout', authenticateToken, async (req, res) => {
  // In a JWT-based system, logout is typically handled client-side
  // by removing the token. In a production system, you might want
  // to maintain a blacklist of revoked tokens.

  res.json({
    success: true,
    message: 'Logout successful'
  });
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', authenticateToken, validate(userSchemas.updateProfile), async (req, res) => {
  try {
    const updates = req.body;
    const user = await userService.updateProfile(req.user.id, updates);

    res.json({
      success: true,
      data: user,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);

    if (error.message === 'Email already exists') {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }

    if (error.message === 'User not found' || error.message === 'No valid fields to update') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

/**
 * PUT /api/auth/password
 * Change user password
 */
router.put('/password', authenticateToken, validate(userSchemas.changePassword), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    await userService.changePassword(req.user.id, currentPassword, newPassword);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);

    if (error.message === 'Current password is incorrect' || error.message === 'User not found') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

/**
 * DELETE /api/auth/account
 * Delete user account
 */
router.delete('/account', authenticateToken, validate(userSchemas.deleteAccount), async (req, res) => {
  try {
    const { password } = req.body;

    await userService.deleteAccount(req.user.id, password);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);

    if (error.message === 'Password is incorrect' || error.message === 'User not found') {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete account'
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const { generateToken } = require('../middleware/auth');
    const newToken = generateToken(req.user.id);

    res.json({
      success: true,
      data: {
        token: newToken,
        user: req.user
      },
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh token'
    });
  }
});

module.exports = router;