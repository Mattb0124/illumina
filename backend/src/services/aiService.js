const { query } = require('../config/database');

/**
 * AI Study Generation Service
 *
 * Uses direct OpenAI API calls for efficient Bible study generation.
 * Streamlined architecture for optimal performance and maintainability.
 */
class AIService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.apiUrl = 'https://api.openai.com/v1/chat/completions';
  }

  /**
   * Check if AI service is enabled
   */
  isEnabled() {
    return !!(this.openaiApiKey && this.openaiApiKey.startsWith('sk-'));
  }

  /**
   * Generate study using streamlined approach
   */
  async generateStudy(request) {
    if (!this.isEnabled()) {
      throw new Error('AI service is not properly configured. Missing OpenAI API key.');
    }

    const startTime = new Date();
    console.log('🚀 Starting AI study generation');
    console.log('📋 Request:', {
      requestId: request.requestId,
      title: request.title,
      topic: request.topic,
      durationDays: request.durationDays
    });

    try {
      // Update status to processing
      await this.updateRequestStatus(request.requestId, 'processing', 10);
      await this.updateWorkflowStep(request.requestId, 'parse_request', 'completed');

      // Generate study plan with single AI call
      console.log('🤖 Generating study content with OpenAI...');
      const studyContent = await this.generateStudyContent(request);

      // Store generated content
      console.log('💾 Storing generated content...');
      await this.storeGeneratedContent(request.requestId, studyContent);

      // Update final status
      await this.updateRequestStatus(request.requestId, 'completed', 100);
      await this.updateWorkflowStep(request.requestId, 'completed', 'completed');

      const endTime = new Date();
      const duration = endTime - startTime;

      console.log('✅ Study generation completed successfully');
      console.log(`⏱️ Total time: ${Math.round(duration / 1000)}s`);
      console.log(`📖 Generated ${studyContent.length} days of content`);

      return {
        status: 'completed',
        progress: 100,
        generatedContent: studyContent,
        duration
      };

    } catch (error) {
      console.error('💥 AI study generation failed:', error.message);

      // Update error status
      await this.updateRequestStatus(request.requestId, 'failed', 0, error.message);
      await this.updateWorkflowStep(request.requestId, 'failed', 'failed', { error: error.message });

      throw error;
    }
  }

  /**
   * Generate study content using OpenAI API
   */
  async generateStudyContent(request) {
    const prompt = this.buildStudyPrompt(request);

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a Bible study curriculum expert who creates comprehensive, theologically sound Bible studies.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    // Parse the generated content into structured format
    return this.parseGeneratedContent(generatedText, request.durationDays);
  }

  /**
   * Build the study generation prompt
   */
  buildStudyPrompt(request) {
    return `Create a comprehensive ${request.durationDays}-day Bible study on "${request.topic}" with the title "${request.title}".

Study Details:
- Topic: ${request.topic}
- Duration: ${request.durationDays} days
- Style: ${request.studyStyle}
- Difficulty: ${request.difficulty}
- Audience: ${request.audience}
- Special Requirements: ${request.specialRequirements}

For each day, provide:
1. Day title and theme
2. Opening prayer (2-3 sentences)
3. Main Bible passage with reference
4. Teaching content (2-3 paragraphs)
5. Discussion questions (3-4 questions)
6. Reflection question (1 personal question)
7. Application points (2-3 practical actions)
8. Closing prayer (2-3 sentences)

Format the response as JSON with this structure:
{
  "days": [
    {
      "dayNumber": 1,
      "title": "Day title",
      "theme": "Main theme",
      "openingPrayer": "Prayer text",
      "mainPassage": "Bible reference",
      "teachingContent": "Teaching paragraphs",
      "discussionQuestions": ["Question 1", "Question 2", "Question 3"],
      "reflectionQuestion": "Personal reflection question",
      "applicationPoints": ["Action 1", "Action 2"],
      "closingPrayer": "Closing prayer text"
    }
  ]
}

Make sure all Bible references are accurate and the content is theologically sound.`;
  }

  /**
   * Parse generated content into database format
   */
  parseGeneratedContent(generatedText, expectedDays) {
    try {
      // Extract JSON from the response (handle cases where it's wrapped in markdown)
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in generated content');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const days = parsed.days || [];

      // Validate we have the right number of days
      if (days.length !== expectedDays) {
        console.warn(`Generated ${days.length} days but expected ${expectedDays}`);
      }

      return days.map((day, index) => ({
        dayNumber: day.dayNumber || (index + 1),
        title: day.title || `Day ${index + 1}`,
        theme: day.theme || day.title,
        openingPrayer: day.openingPrayer,
        studyFocus: day.teachingContent,
        teachingContent: day.teachingContent,
        biblePassages: day.mainPassage ? [{ reference: day.mainPassage }] : [],
        discussionQuestions: day.discussionQuestions || [],
        reflectionQuestion: day.reflectionQuestion,
        applicationPoints: day.applicationPoints || [],
        prayerFocus: day.closingPrayer,
        estimatedTime: '20-30 minutes',
        generationStatus: 'completed'
      }));

    } catch (error) {
      console.error('Error parsing generated content:', error);

      // Return basic structure if parsing fails
      const fallbackContent = [];
      for (let i = 1; i <= expectedDays; i++) {
        fallbackContent.push({
          dayNumber: i,
          title: `Day ${i}: ${request.topic} Study`,
          theme: `${request.topic} - Day ${i}`,
          openingPrayer: 'Lord, open our hearts to Your word today.',
          studyFocus: `Day ${i} of our study on ${request.topic}.`,
          teachingContent: generatedText.substring(0, 500) + '...',
          biblePassages: [],
          discussionQuestions: ['What does this passage teach us?'],
          reflectionQuestion: 'How can you apply this to your life?',
          applicationPoints: ['Reflect on today\'s lesson'],
          prayerFocus: 'Thank God for His word and guidance.',
          estimatedTime: '20-30 minutes',
          generationStatus: 'completed'
        });
      }
      return fallbackContent;
    }
  }

  /**
   * Store generated content in database
   */
  async storeGeneratedContent(requestId, generatedContent) {
    for (const dayContent of generatedContent) {
      await query(
        `INSERT INTO generated_study_content
         (request_id, day_number, week_number, title, theme, opening_prayer,
          study_focus, teaching_content, bible_passages, discussion_questions,
          reflection_question, application_points, prayer_focus, estimated_time,
          content_data, generation_status, validation_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
        [
          requestId,
          dayContent.dayNumber,
          Math.ceil(dayContent.dayNumber / 7), // Week number
          dayContent.title,
          dayContent.theme,
          dayContent.openingPrayer,
          dayContent.studyFocus,
          dayContent.teachingContent,
          JSON.stringify(dayContent.biblePassages),
          JSON.stringify(dayContent.discussionQuestions),
          dayContent.reflectionQuestion,
          JSON.stringify(dayContent.applicationPoints),
          dayContent.prayerFocus,
          dayContent.estimatedTime,
          JSON.stringify(dayContent),
          dayContent.generationStatus,
          'approved' // Auto-approve for now
        ]
      );
    }
  }

  /**
   * Update request status
   */
  async updateRequestStatus(requestId, status, progress, errorMessage = null) {
    await query(
      `UPDATE study_generation_requests
       SET status = $1, progress_percentage = $2, error_message = $3, updated_at = NOW()
       WHERE id = $4`,
      [status, progress, errorMessage, requestId]
    );
  }

  /**
   * Update workflow step
   */
  async updateWorkflowStep(requestId, step, status, data = {}) {
    await query(
      `INSERT INTO workflow_state
       (request_id, current_step, step_status, step_data, started_at, completed_at)
       VALUES ($1, $2, $3, $4, NOW(), $5)
       ON CONFLICT (request_id, current_step)
       DO UPDATE SET
         step_status = EXCLUDED.step_status,
         step_data = EXCLUDED.step_data,
         completed_at = EXCLUDED.completed_at,
         updated_at = NOW()`,
      [
        requestId,
        step,
        status,
        JSON.stringify(data),
        status === 'completed' ? new Date() : null
      ]
    );
  }
}

module.exports = { AIService };