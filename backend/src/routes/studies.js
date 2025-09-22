const express = require('express');
const studyService = require('../services/studyService');
const studyContentService = require('../services/studyContentService');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { studySchemas, querySchemas, validate } = require('../utils/validation');

const router = express.Router();

/**
 * GET /api/studies
 * Get all available studies (public endpoint with optional auth)
 */
router.get('/', optionalAuth, validate(querySchemas.studyFilters, 'query'), async (req, res) => {
  try {
    const filters = req.query;
    const studies = await studyService.getAllStudies(filters);

    res.json({
      success: true,
      data: studies
    });
  } catch (error) {
    console.error('Get studies error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get studies'
    });
  }
});

/**
 * GET /api/studies/:id
 * Get study metadata by ID (public endpoint)
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get study metadata from database
    const study = await studyService.getStudyById(id);

    // Get study structure from content service
    const structure = await studyContentService.getStudyStructure(id);

    res.json({
      success: true,
      data: {
        ...study,
        structure
      }
    });
  } catch (error) {
    console.error('Get study error:', error);

    if (error.message === 'Study not found') {
      return res.status(404).json({
        success: false,
        error: 'Study not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to get study'
    });
  }
});

/**
 * GET /api/studies/:id/week/:weekNum
 * Get week overview content
 */
router.get('/:id/week/:weekNum', async (req, res) => {
  try {
    const { id, weekNum } = req.params;
    const weekNumber = parseInt(weekNum);

    if (isNaN(weekNumber) || weekNumber < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid week number'
      });
    }

    const weekContent = await studyContentService.getWeekOverview(id, weekNumber);

    res.json({
      success: true,
      data: weekContent
    });
  } catch (error) {
    console.error('Get week content error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Week content not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to get week content'
    });
  }
});

/**
 * GET /api/studies/:id/day/:dayNum
 * Get specific day content (for daily studies)
 */
router.get('/:id/day/:dayNum', async (req, res) => {
  try {
    const { id, dayNum } = req.params;
    const dayNumber = parseInt(dayNum);

    if (isNaN(dayNumber) || dayNumber < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid day number'
      });
    }

    const dayContent = await studyContentService.getDayContent(id, dayNumber);

    res.json({
      success: true,
      data: dayContent
    });
  } catch (error) {
    console.error('Get day content error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Day content not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to get day content'
    });
  }
});

/**
 * GET /api/studies/:id/week/:weekNum/day/:dayNum
 * Get specific day content within a week (for weekly studies)
 */
router.get('/:id/week/:weekNum/day/:dayNum', async (req, res) => {
  try {
    const { id, weekNum, dayNum } = req.params;
    const weekNumber = parseInt(weekNum);
    const dayNumber = parseInt(dayNum);

    if (isNaN(weekNumber) || weekNumber < 1 || isNaN(dayNumber) || dayNumber < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid week or day number'
      });
    }

    const dayContent = await studyContentService.getDayContent(id, dayNumber, weekNumber);

    res.json({
      success: true,
      data: dayContent
    });
  } catch (error) {
    console.error('Get weekly day content error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Day content not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to get day content'
    });
  }
});

/**
 * GET /api/studies/user/enrolled
 * Get user's enrolled studies with progress
 */
router.get('/user/enrolled', authenticateToken, async (req, res) => {
  try {
    const studies = await studyService.getUserStudies(req.user.id);

    res.json({
      success: true,
      data: studies
    });
  } catch (error) {
    console.error('Get user studies error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user studies'
    });
  }
});

/**
 * POST /api/studies/:id/enroll
 * Enroll user in a study
 */
router.post('/:id/enroll', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const enrollment = await studyService.enrollUserInStudy(req.user.id, id);

    res.status(201).json({
      success: true,
      data: enrollment,
      message: 'Successfully enrolled in study'
    });
  } catch (error) {
    console.error('Enroll in study error:', error);

    if (error.message === 'Study not found or not available') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    if (error.message === 'User is already enrolled in this study') {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to enroll in study'
    });
  }
});

/**
 * GET /api/studies/:id/progress
 * Get user's progress for a specific study
 */
router.get('/:id/progress', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const progress = await studyService.getUserStudyProgress(req.user.id, id);

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Get study progress error:', error);

    if (error.message === 'User not enrolled in this study') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to get study progress'
    });
  }
});

/**
 * PUT /api/studies/:id/progress/day/:dayNum
 * Update progress for a specific day
 */
router.put('/:id/progress/day/:dayNum',
  authenticateToken,
  validate(studySchemas.updateProgress),
  async (req, res) => {
    try {
      const { id, dayNum } = req.params;
      const dayNumber = parseInt(dayNum);

      if (isNaN(dayNumber) || dayNumber < 1) {
        return res.status(400).json({
          success: false,
          error: 'Invalid day number'
        });
      }

      const progressData = req.body;

      const result = await studyService.updateStudyProgress(
        req.user.id,
        id,
        dayNumber,
        progressData
      );

      res.json({
        success: true,
        data: result,
        message: 'Progress updated successfully'
      });
    } catch (error) {
      console.error('Update progress error:', error);

      if (error.message === 'User not enrolled in this study') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update progress'
      });
    }
  }
);

/**
 * GET /api/studies/:id/complete
 * Get complete study with all content (for export/backup)
 */
router.get('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify user is enrolled in the study
    await studyService.getUserStudyProgress(req.user.id, id);

    // Get complete study content
    const completeStudy = await studyContentService.getCompleteStudy(id);

    res.json({
      success: true,
      data: completeStudy
    });
  } catch (error) {
    console.error('Get complete study error:', error);

    if (error.message === 'User not enrolled in this study') {
      return res.status(403).json({
        success: false,
        error: 'Access denied: not enrolled in this study'
      });
    }

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Study not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to get complete study'
    });
  }
});

module.exports = router;