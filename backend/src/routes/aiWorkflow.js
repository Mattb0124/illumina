const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../config/database');
const { AIService } = require('../services/aiService');

const router = express.Router();

// Initialize AI service
const aiService = new AIService();

/**
 * POST /api/ai/generate-study
 * Start a new AI study generation workflow
 */
router.post('/generate-study', authenticateToken, async (req, res) => {
  console.log('🚀 AI Study Generation Request Started');
  console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
  console.log('👤 User ID:', req.user.id);

  try {
    // Check if AI service is enabled
    if (!aiService.isEnabled()) {
      console.error('❌ AI service is disabled - missing OpenAI API key');
      return res.status(503).json({
        success: false,
        error: 'AI study generation is currently disabled. Please check OpenAI API key configuration.'
      });
    }

    // Create a proper UUID for the request
    const requestId = uuidv4();
    console.log('🆔 Generated request ID:', requestId);

    // Extract and validate form data
    const { userRequest, title, topic, duration, studyStyle, difficulty, audience, specialRequirements } = req.body;

    // Validate required fields
    if (!userRequest || !title || !topic || !duration) {
      console.error('❌ Missing required fields:', { userRequest: !!userRequest, title: !!title, topic: !!topic, duration: !!duration });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userRequest, title, topic, duration'
      });
    }

    // Parse duration to days
    const durationDays = parseDurationToDays(duration);
    console.log('📅 Parsed duration:', duration, '->', durationDays, 'days');

    // Create initial generation request record
    const requestDetails = {
      userRequest,
      title,
      topic,
      duration,
      studyStyle: studyStyle || 'devotional',
      difficulty: difficulty || 'beginner',
      audience: audience || 'individual',
      specialRequirements: specialRequirements || '',
      requestedAt: new Date().toISOString(),
      requestedBy: req.user.id
    };

    console.log('💾 Creating database record...');
    // Insert request into database
    await query(
      `INSERT INTO study_generation_requests
       (id, user_id, title, topic, duration, duration_days, study_style,
        difficulty, audience, special_requirements, request_details, status, progress_percentage)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        requestId,
        req.user.id,
        requestDetails.title,
        requestDetails.topic,
        requestDetails.duration,
        durationDays,
        requestDetails.studyStyle,
        requestDetails.difficulty,
        requestDetails.audience,
        requestDetails.specialRequirements,
        JSON.stringify(requestDetails),
        'pending', // Start in pending state
        0 // Initial progress
      ]
    );

    console.log('✅ Database record created successfully');

    // Prepare the AI workflow request
    const workflowRequest = {
      requestId,
      userId: req.user.id,
      userRequest: requestDetails.userRequest,
      title: requestDetails.title,
      topic: requestDetails.topic,
      duration: requestDetails.duration,
      durationDays,
      studyStyle: requestDetails.studyStyle,
      difficulty: requestDetails.difficulty,
      audience: requestDetails.audience,
      specialRequirements: requestDetails.specialRequirements
    };

    console.log('🤖 Starting AI workflow...');
    // Start the AI workflow asynchronously (don't wait for completion)
    aiService.generateStudy(workflowRequest).catch(error => {
      console.error('💥 AI Workflow failed:', error);
      // Error handling is done within the service
    });

    console.log('📤 Sending success response to client');
    // Immediately return success response
    return res.json({
      success: true,
      data: {
        requestId,
        status: 'pending',
        message: 'AI study generation started successfully! Your study is being created.',
        estimatedTime: estimateGenerationTime(durationDays)
      }
    });

  } catch (error) {
    console.error('💥 Error starting study generation:', error);
    console.error('📊 Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to start study generation: ' + error.message
    });
  }
});

/**
 * GET /api/ai/generation-status/:requestId
 * Get the status of a study generation request
 */
router.get('/generation-status/:requestId', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;

    // Get request details
    const requestResult = await query(
      `SELECT * FROM study_generation_requests WHERE id = $1 AND user_id = $2`,
      [requestId, req.user.id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Generation request not found'
      });
    }

    const request = requestResult.rows[0];

    // Get workflow state
    const workflowResult = await query(
      `SELECT * FROM workflow_state WHERE request_id = $1 ORDER BY created_at DESC`,
      [requestId]
    );

    // Get generated content count
    const contentResult = await query(
      `SELECT COUNT(*) as count FROM generated_study_content WHERE request_id = $1`,
      [requestId]
    );

    const generatedDays = parseInt(contentResult.rows[0].count);

    res.json({
      success: true,
      data: {
        requestId: request.id,
        status: request.status,
        progress: request.progress_percentage,
        title: request.title,
        topic: request.topic,
        duration: request.duration,
        durationDays: request.duration_days,
        errorMessage: request.error_message,
        createdAt: request.created_at,
        updatedAt: request.updated_at,
        completionDate: request.completion_date,
        workflowSteps: workflowResult.rows.map(step => ({
          step: step.current_step,
          status: step.step_status,
          startedAt: step.started_at,
          completedAt: step.completed_at,
          data: step.step_data
        })),
        generatedDays,
        totalDays: request.duration_days
      }
    });

  } catch (error) {
    console.error('Error fetching generation status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch generation status'
    });
  }
});

/**
 * GET /api/ai/generated-study/:requestId
 * Get the generated study content
 */
router.get('/generated-study/:requestId', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;

    // Verify request belongs to user and is completed
    const requestResult = await query(
      `SELECT * FROM study_generation_requests
       WHERE id = $1 AND user_id = $2 AND status = 'completed'`,
      [requestId, req.user.id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Completed study not found'
      });
    }

    const request = requestResult.rows[0];

    // Get all generated content
    const contentResult = await query(
      `SELECT * FROM generated_study_content
       WHERE request_id = $1
       ORDER BY day_number ASC`,
      [requestId]
    );

    const studyContent = contentResult.rows.map(row => ({
      dayNumber: row.day_number,
      weekNumber: row.week_number,
      title: row.title,
      theme: row.theme,
      openingPrayer: row.opening_prayer,
      studyFocus: row.study_focus,
      teachingContent: row.teaching_content,
      biblePassages: row.bible_passages,
      discussionQuestions: row.discussion_questions,
      reflectionQuestion: row.reflection_question,
      applicationPoints: row.application_points,
      prayerFocus: row.prayer_focus,
      estimatedTime: row.estimated_time,
      fullContent: row.content_data,
      generationStatus: row.generation_status,
      validationStatus: row.validation_status,
      validationNotes: row.validation_notes
    }));

    res.json({
      success: true,
      data: {
        request: {
          id: request.id,
          title: request.title,
          topic: request.topic,
          duration: request.duration,
          durationDays: request.duration_days,
          studyStyle: request.study_style,
          difficulty: request.difficulty,
          audience: request.audience,
          specialRequirements: request.special_requirements,
          completedAt: request.completion_date
        },
        studyContent,
        summary: {
          totalDays: studyContent.length,
          completedDays: studyContent.filter(day => day.generationStatus === 'completed').length,
          approvedDays: studyContent.filter(day => day.validationStatus === 'approved').length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching generated study:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch generated study'
    });
  }
});

/**
 * GET /api/ai/user-requests
 * Get all study generation requests for the authenticated user
 */
router.get('/user-requests', authenticateToken, async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;

    let whereClause = 'WHERE user_id = $1';
    const params = [req.user.id];

    if (status) {
      whereClause += ' AND status = $2';
      params.push(status);
    }

    const result = await query(
      `SELECT id, title, topic, duration, study_style, difficulty, audience,
              status, progress_percentage, error_message, created_at, updated_at, completion_date
       FROM study_generation_requests
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const totalResult = await query(
      `SELECT COUNT(*) as total FROM study_generation_requests ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        requests: result.rows,
        pagination: {
          total: parseInt(totalResult.rows[0].total),
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: parseInt(offset) + parseInt(limit) < parseInt(totalResult.rows[0].total)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user requests'
    });
  }
});

/**
 * DELETE /api/ai/cancel-generation/:requestId
 * Cancel a pending study generation request
 */
router.delete('/cancel-generation/:requestId', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;

    // Update request status to cancelled
    const result = await query(
      `UPDATE study_generation_requests
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND status IN ('pending', 'processing')`,
      [requestId, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Request not found or cannot be cancelled'
      });
    }

    res.json({
      success: true,
      message: 'Generation request cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling generation request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel generation request'
    });
  }
});

/**
 * GET /api/ai/config-status
 * Get AI workflow configuration status
 */
router.get('/config-status', authenticateToken, async (req, res) => {
  try {
    const isEnabled = aiService.isEnabled();
    console.log('🔧 AI Config Status Check - Enabled:', isEnabled);

    res.json({
      success: true,
      data: {
        enabled: isEnabled,
        features: {
          studyGeneration: isEnabled,
          bibleValidation: true,
          theologicalValidation: true
        },
        limitations: {
          maxDuration: 365,
          maxConcurrentGenerations: 3
        }
      }
    });

  } catch (error) {
    console.error('💥 Error fetching config status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch configuration status'
    });
  }
});

// Utility functions
function parseDurationToDays(duration) {
  if (!duration) return 30;

  const lowerDuration = duration.toLowerCase();
  const numbers = lowerDuration.match(/\\d+/g);

  if (!numbers || numbers.length === 0) return 30;

  const value = parseInt(numbers[0]);

  if (lowerDuration.includes('week')) {
    return value * 7;
  } else if (lowerDuration.includes('month')) {
    return value * 30;
  } else if (lowerDuration.includes('day')) {
    return value;
  } else {
    return value; // Assume days if no unit specified
  }
}

function estimateGenerationTime(durationDays) {
  // Rough estimate: 2-3 minutes per day of content
  const baseMinutes = durationDays * 2.5;
  const minutes = Math.max(5, Math.min(120, baseMinutes)); // Between 5 minutes and 2 hours

  if (minutes < 60) {
    return `${Math.round(minutes)} minutes`;
  } else {
    const hours = Math.round(minutes / 60 * 10) / 10;
    return `${hours} hours`;
  }
}

module.exports = router;