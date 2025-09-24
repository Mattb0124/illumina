import express, { Request, Response } from 'express';
import { authenticateToken, generateToken } from '../middleware/auth.js';

const router = express.Router();

// Minimal auth routes for now - will be expanded later
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Simplified login - in production would validate against database
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password required'
      });
    }

    // For demo purposes, create a mock user
    const mockUserId = 'demo-user-id';
    const token = generateToken(mockUserId);

    res.json({
      success: true,
      data: {
        user: { id: mockUserId, email },
        token
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

router.get('/me', authenticateToken, async (req: Request, res: Response) => {
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

export default router;