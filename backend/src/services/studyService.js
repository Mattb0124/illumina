const { query, getClient } = require('../config/database');
const studyContentService = require('./studyContentService');

class StudyService {
  /**
   * Get all available studies (metadata only)
   */
  async getAllStudies(filters = {}) {
    try {
      let whereClause = 'WHERE status = $1';
      let params = ['Published'];
      let paramIndex = 2;

      // Add filters
      if (filters.difficulty) {
        whereClause += ` AND difficulty = $${paramIndex}`;
        params.push(filters.difficulty);
        paramIndex++;
      }

      if (filters.audience) {
        whereClause += ` AND audience = $${paramIndex}`;
        params.push(filters.audience);
        paramIndex++;
      }

      if (filters.studyStyle) {
        whereClause += ` AND study_style = $${paramIndex}`;
        params.push(filters.studyStyle);
        paramIndex++;
      }

      if (filters.tags && filters.tags.length > 0) {
        whereClause += ` AND tags && $${paramIndex}`;
        params.push(filters.tags);
        paramIndex++;
      }

      const result = await query(
        `SELECT id, title, theme, description, duration_days, study_style,
                difficulty, audience, study_structure, estimated_time_per_session,
                pastor_message, generated_by, popularity, tags, status,
                created_at, updated_at
         FROM studies
         ${whereClause}
         ORDER BY popularity DESC, created_at DESC`,
        params
      );

      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get studies: ${error.message}`);
    }
  }

  /**
   * Get study by ID (metadata only)
   */
  async getStudyById(studyId) {
    try {
      const result = await query(
        `SELECT id, title, theme, description, duration_days, study_style,
                difficulty, audience, study_structure, estimated_time_per_session,
                pastor_message, generated_by, generation_prompt, popularity,
                tags, status, created_at, updated_at
         FROM studies
         WHERE id = $1 AND status = $2`,
        [studyId, 'Published']
      );

      if (result.rows.length === 0) {
        throw new Error('Study not found');
      }

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user's enrolled studies with progress
   */
  async getUserStudies(userId) {
    try {
      const result = await query(
        `SELECT
           us.id as user_study_id,
           us.started_at,
           us.current_day,
           us.current_week,
           us.completed_at,
           us.status,
           s.id,
           s.title,
           s.theme,
           s.description,
           s.duration_days,
           s.study_style,
           s.difficulty,
           s.audience,
           s.study_structure,
           s.estimated_time_per_session,
           s.pastor_message,
           s.popularity,
           s.tags,
           COUNT(sp.id) as completed_days
         FROM user_studies us
         JOIN studies s ON us.study_id = s.id
         LEFT JOIN study_progress sp ON us.id = sp.user_study_id AND sp.completed_at IS NOT NULL
         WHERE us.user_id = $1
         GROUP BY us.id, s.id
         ORDER BY us.started_at DESC`,
        [userId]
      );

      return result.rows.map(row => ({
        userStudyId: row.user_study_id,
        study: {
          id: row.id,
          title: row.title,
          theme: row.theme,
          description: row.description,
          duration: row.duration_days,
          studyStyle: row.study_style,
          difficulty: row.difficulty,
          audience: row.audience,
          studyStructure: row.study_structure,
          estimatedTimePerSession: row.estimated_time_per_session,
          pastorMessage: row.pastor_message,
          popularity: parseFloat(row.popularity),
          tags: row.tags
        },
        progress: {
          currentDay: row.current_day,
          currentWeek: row.current_week,
          completedDays: parseInt(row.completed_days),
          totalDays: row.duration_days,
          percentComplete: Math.round((parseInt(row.completed_days) / row.duration_days) * 100)
        },
        startDate: row.started_at,
        completedDate: row.completed_at,
        status: row.status
      }));
    } catch (error) {
      throw new Error(`Failed to get user studies: ${error.message}`);
    }
  }

  /**
   * Enroll user in a study
   */
  async enrollUserInStudy(userId, studyId) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Check if study exists
      const studyCheck = await client.query(
        'SELECT id, duration_days FROM studies WHERE id = $1 AND status = $2',
        [studyId, 'Published']
      );

      if (studyCheck.rows.length === 0) {
        throw new Error('Study not found or not available');
      }

      // Check if user is already enrolled
      const enrollmentCheck = await client.query(
        'SELECT id FROM user_studies WHERE user_id = $1 AND study_id = $2',
        [userId, studyId]
      );

      if (enrollmentCheck.rows.length > 0) {
        throw new Error('User is already enrolled in this study');
      }

      // Enroll user
      const result = await client.query(
        `INSERT INTO user_studies (user_id, study_id, current_day, status)
         VALUES ($1, $2, 1, 'active')
         RETURNING id, started_at, current_day, current_week, status`,
        [userId, studyId]
      );

      await client.query('COMMIT');

      return {
        userStudyId: result.rows[0].id,
        studyId,
        startDate: result.rows[0].started_at,
        currentDay: result.rows[0].current_day,
        currentWeek: result.rows[0].current_week,
        status: result.rows[0].status
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update study progress
   */
  async updateStudyProgress(userId, studyId, dayNumber, progressData) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Get user study enrollment
      const enrollment = await client.query(
        'SELECT id FROM user_studies WHERE user_id = $1 AND study_id = $2',
        [userId, studyId]
      );

      if (enrollment.rows.length === 0) {
        throw new Error('User not enrolled in this study');
      }

      const userStudyId = enrollment.rows[0].id;

      // Upsert progress record
      const progressResult = await client.query(
        `INSERT INTO study_progress (user_study_id, day_number, week_number, completed_at, notes, reflection_answers)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_study_id, day_number)
         DO UPDATE SET
           week_number = EXCLUDED.week_number,
           completed_at = EXCLUDED.completed_at,
           notes = EXCLUDED.notes,
           reflection_answers = EXCLUDED.reflection_answers
         RETURNING id, completed_at`,
        [
          userStudyId,
          dayNumber,
          progressData.weekNumber || null,
          progressData.completed ? new Date() : null,
          progressData.notes || null,
          progressData.reflectionAnswers ? JSON.stringify(progressData.reflectionAnswers) : null
        ]
      );

      // Update current day/week in user_studies if this is progress forward
      const currentProgress = await client.query(
        'SELECT current_day, current_week FROM user_studies WHERE id = $1',
        [userStudyId]
      );

      const currentDay = currentProgress.rows[0].current_day;
      const currentWeek = currentProgress.rows[0].current_week;

      if (dayNumber >= currentDay) {
        await client.query(
          'UPDATE user_studies SET current_day = $1, current_week = $2 WHERE id = $3',
          [dayNumber + 1, progressData.weekNumber || currentWeek, userStudyId]
        );
      }

      // Check if study is completed
      const completedDays = await client.query(
        'SELECT COUNT(*) as count FROM study_progress WHERE user_study_id = $1 AND completed_at IS NOT NULL',
        [userStudyId]
      );

      const studyInfo = await client.query(
        'SELECT duration_days FROM studies s JOIN user_studies us ON s.id = us.study_id WHERE us.id = $1',
        [userStudyId]
      );

      const totalDays = studyInfo.rows[0].duration_days;
      const completedCount = parseInt(completedDays.rows[0].count);

      if (completedCount >= totalDays) {
        await client.query(
          'UPDATE user_studies SET status = $1, completed_at = $2 WHERE id = $3',
          ['completed', new Date(), userStudyId]
        );
      }

      await client.query('COMMIT');

      return {
        progressId: progressResult.rows[0].id,
        completed: !!progressResult.rows[0].completed_at,
        totalCompleted: completedCount,
        totalDays: totalDays,
        percentComplete: Math.round((completedCount / totalDays) * 100)
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get user's progress for a specific study
   */
  async getUserStudyProgress(userId, studyId) {
    try {
      const result = await query(
        `SELECT
           us.id as user_study_id,
           us.started_at,
           us.current_day,
           us.current_week,
           us.completed_at,
           us.status,
           s.duration_days,
           s.study_structure,
           json_agg(
             json_build_object(
               'day', sp.day_number,
               'week', sp.week_number,
               'completedAt', sp.completed_at,
               'notes', sp.notes,
               'reflectionAnswers', sp.reflection_answers
             ) ORDER BY sp.day_number
           ) FILTER (WHERE sp.id IS NOT NULL) as progress_details
         FROM user_studies us
         JOIN studies s ON us.study_id = s.id
         LEFT JOIN study_progress sp ON us.id = sp.user_study_id
         WHERE us.user_id = $1 AND us.study_id = $2
         GROUP BY us.id, s.duration_days, s.study_structure`,
        [userId, studyId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not enrolled in this study');
      }

      const row = result.rows[0];
      const completedDays = row.progress_details ?
        row.progress_details.filter(p => p.completedAt).length : 0;

      return {
        userStudyId: row.user_study_id,
        studyId,
        startDate: row.started_at,
        completedDate: row.completed_at,
        status: row.status,
        currentDay: row.current_day,
        currentWeek: row.current_week,
        progress: {
          completedDays,
          totalDays: row.duration_days,
          percentComplete: Math.round((completedDays / row.duration_days) * 100),
          details: row.progress_details || []
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new study (for AI generation)
   */
  async createStudy(studyData) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      const result = await client.query(
        `INSERT INTO studies (
           id, title, theme, description, duration_days, study_style,
           difficulty, audience, study_structure, estimated_time_per_session,
           pastor_message, generated_by, generation_prompt, tags, status
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         RETURNING *`,
        [
          studyData.id,
          studyData.title,
          studyData.theme,
          studyData.description,
          studyData.duration,
          studyData.studyStyle,
          studyData.difficulty,
          studyData.audience,
          studyData.studyStructure,
          studyData.estimatedTimePerSession,
          studyData.pastorMessage,
          studyData.generatedBy || 'AI',
          studyData.generationPrompt,
          studyData.tags || [],
          studyData.status || 'Draft'
        ]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new StudyService();