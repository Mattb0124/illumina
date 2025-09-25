import express, { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { authenticateToken } from '../middleware/auth.js';
import { AIService } from '../services/aiService.js';
import type { StudyGenerationRequest } from '../types/index.js';

const router = express.Router();
const aiService = new AIService();

/**
 * POST /api/ai/generate-study
 * Generate a new Bible study using AI
 */
router.post('/generate-study', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!aiService.isEnabled()) {
      return res.status(503).json({
        success: false,
        error: 'AI service is not configured. Please check OpenAI API key configuration.'
      });
    }

    const {
      title,
      topic,
      duration_days,
      difficulty = 'intermediate',
      audience = 'general',
      study_style = 'devotional',
      special_requirements
    } = req.body;

    // Validate required fields
    if (!title || !topic || !duration_days) {
      return res.status(400).json({
        success: false,
        error: 'Title, topic, and duration_days are required'
      });
    }

    // Create request object
    const request: StudyGenerationRequest = {
      id: randomUUID(),
      user_id: req.user?.id || 'anonymous',
      title,
      topic,
      duration_days: parseInt(duration_days),
      difficulty,
      audience,
      study_style,
      special_requirements,
      status: 'pending',
      progress_percentage: 0
    };

    console.log('🚀 Starting AI study generation request:', request);

    // Generate study
    const result = await aiService.generateStudy(request);

    res.json({
      success: true,
      data: result,
      message: 'Study generated successfully'
    });

  } catch (error) {
    console.error('AI study generation error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(500).json({
      success: false,
      error: 'Study generation failed',
      details: errorMessage
    });
  }
});

/**
 * GET /api/ai/status
 * Check AI service status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const isEnabled = aiService.isEnabled();
    
    res.json({
      success: true,
      data: {
        aiEnabled: isEnabled,
        status: isEnabled ? 'ready' : 'disabled',
        message: isEnabled ? 'AI service is ready' : 'AI service requires OpenAI API key configuration'
      }
    });
  } catch (error) {
    console.error('AI status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check AI service status'
    });
  }
});

export default router;