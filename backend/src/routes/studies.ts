import express, { Request, Response } from 'express';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Minimal studies routes for now
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    // Mock studies data
    const mockStudies = [
      {
        id: '1',
        title: 'Foundations of Faith',
        description: 'A 7-day study exploring the fundamentals of Christian faith',
        duration_days: 7,
        difficulty_level: 'beginner',
        tags: ['faith', 'basics', 'foundations']
      }
    ];

    res.json({
      success: true,
      data: mockStudies
    });
  } catch (error) {
    console.error('Get studies error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch studies'
    });
  }
});

export default router;