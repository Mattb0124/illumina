import OpenAI from 'openai';
import path from 'path';
import fs from 'fs/promises';
import dotenv from 'dotenv';
import { query } from '../config/database.js';

// Load environment variables from .env file
dotenv.config();
import {
  StudyRequestSchema,
  AIStudyPlanResponseSchema,
  StudyPlanSchema,
  DailyStudyContentSchema,
  StudyManifestSchema,
  type StudyRequest,
  type AIStudyPlanResponse,
  type StudyPlan,
  type DailyStudyContent,
  type StudyManifest
} from '../schemas/studySchemas.js';
import type { StudyGenerationRequest, GeneratedStudyContent } from '../types/index.js';
import { PromptTemplateFactory } from './promptTemplates.js';
import { AIResponseParser } from '../utils/aiResponseParser.js';
import { MarkdownGenerator } from '../generators/markdownGenerator.js';
import { IdGenerator } from '../utils/idGenerator.js';

/**
 * Multi-Agent Bible Study Generation Service
 * 
 * Uses OpenAI SDK with a structured multi-step workflow:
 * 1. Planning Phase: Creates structured study plans
 * 2. Content Generation Phase: Creates detailed daily content
 * 3. File Creation Phase: Generates markdown files and manifest
 */
export class AIService {
  private openai: OpenAI;
  private studiesPath: string;
  private config: {
    apiKey: string;
    model: string;
    bookStudyModel: string;
    temperature: number;
    maxTokens: number;
    bookStudyMaxTokens: number;
  };
  private mockMode: boolean;
  private mockData: any;

  constructor() {
    // Load configuration from environment variables
    this.config = {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4',
      bookStudyModel: process.env.OPENAI_BOOK_STUDY_MODEL || 'gpt-4-turbo',
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
      bookStudyMaxTokens: parseInt(process.env.OPENAI_BOOK_STUDY_MAX_TOKENS || '8000')
    };

    // Initialize mock mode - use mock data if no API key or if explicitly enabled
    this.mockMode = !this.config.apiKey || process.env.USE_MOCK_AI === 'true';

    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: this.config.apiKey || 'mock-key'
    });

    this.studiesPath = path.join(process.cwd(), 'studies');

    // Initialize mock data (will be loaded lazily when needed)
    this.mockData = null;

    // Log configuration (without exposing the full API key)
    if (this.mockMode) {
      console.log('🔧 AI Service Configuration (Mock Mode):');
      console.log('   Using hardcoded test data instead of OpenAI API');
    } else if (this.config.apiKey) {
      console.log('🔧 AI Service Configuration:');
      console.log(`   Default Model: ${this.config.model}`);
      console.log(`   Book Study Model: ${this.config.bookStudyModel}`);
      console.log(`   Temperature: ${this.config.temperature}`);
      console.log(`   Default Max Tokens: ${this.config.maxTokens}`);
      console.log(`   Book Study Max Tokens: ${this.config.bookStudyMaxTokens}`);
      console.log(`   API Key: ${this.config.apiKey.substring(0, 8)}...`);
    }
  }

  /**
   * Load mock data from JSON file
   */
  private async loadMockData(): Promise<void> {
    if (this.mockMode) {
      try {
        const mockDataPath = path.join(process.cwd(), 'src', 'data', 'mockAIResponses.json');
        const mockDataContent = await fs.readFile(mockDataPath, 'utf8');
        this.mockData = JSON.parse(mockDataContent);
        console.log('✅ Mock AI data loaded successfully');
      } catch (error) {
        console.warn('⚠️  Could not load mock data, will generate basic responses');
        this.mockData = null;
      }
    }
  }

  /**
   * Create study plan using mock data
   */
  private async createMockStudyPlan(request: any): Promise<StudyPlan> {
    // Load mock data if not already loaded
    if (!this.mockData) {
      await this.loadMockData();
    }

    // Use the existing request ID as the study ID for consistency
    const studyId = request.id;

    if (this.mockData?.studyPlanResponse) {
      // Use loaded mock data
      const mockResponse = this.mockData.studyPlanResponse;
      return {
        studyId,
        title: mockResponse.title,
        theme: mockResponse.theme,
        description: mockResponse.description,
        duration: mockResponse.duration,
        estimatedTimePerSession: mockResponse.estimatedTimePerSession,
        pastorMessage: mockResponse.pastorMessage,
        tags: mockResponse.tags,
        dailyPlan: mockResponse.dailyPlan,
        difficulty: request.difficulty,
        audience: request.audience,
        studyStyle: request.study_style
      };
    }

    // Fallback mock data if file couldn't be loaded
    return {
      studyId,
      title: request.title,
      theme: "Faith and Trust",
      description: "A study exploring biblical themes of faith and trust in God.",
      duration: request.duration_days,
      estimatedTimePerSession: "15-20 minutes",
      pastorMessage: "This study will help deepen your relationship with God through His Word.",
      tags: ["faith", "trust", "biblical"],
      dailyPlan: Array.from({ length: request.duration_days }, (_, i) => ({
        day: i + 1,
        title: `Day ${i + 1}: Growing in Faith`,
        theme: "Faith Development",
        focusPassage: "Hebrews 11:1",
        learningObjective: "Learn to trust God more deeply",
        keyPoints: ["Faith is confidence", "God is trustworthy", "Growth requires trust"]
      })),
      difficulty: request.difficulty,
      audience: request.audience,
      studyStyle: request.study_style
    };
  }

  /**
   * Check if AI service is enabled (including mock mode)
   */
  isEnabled(): boolean {
    return this.mockMode || !!(this.config.apiKey && this.config.apiKey.startsWith('sk-'));
  }

  /**
   * Get appropriate model and token limit based on study style
   */
  private getModelConfig(studyStyle: string): { model: string; maxTokens: number } {
    if (studyStyle === 'book-study') {
      return {
        model: this.config.bookStudyModel,
        maxTokens: this.config.bookStudyMaxTokens
      };
    }
    return {
      model: this.config.model,
      maxTokens: this.config.maxTokens
    };
  }

  /**
   * Generate study using multi-step AI workflow
   */
  async generateStudy(request: StudyGenerationRequest): Promise<{
    status: string;
    progress: number;
    generatedContent: GeneratedStudyContent[];
    studyPath?: string;
    duration: number;
  }> {
    if (!this.isEnabled()) {
      throw new Error('AI service is not properly configured. Missing OpenAI API key.');
    }

    const startTime = new Date();
    console.log('🚀 Starting multi-step AI study generation');
    console.log('📋 Request:', {
      requestId: request.id,
      title: request.title,
      topic: request.topic,
      durationDays: request.duration_days
    });

    try {
      // Insert request record if it doesn't exist (self-contained approach)
      if (request.id) {
        await query(
          `INSERT INTO study_generation_requests
           (id, user_id, title, topic, duration, duration_days, study_style, difficulty, audience, special_requirements, request_details, status, progress_percentage, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', 0, NOW(), NOW())
           ON CONFLICT (id) DO NOTHING`,
          [
            request.id,
            request.user_id,
            request.title,
            request.topic,
            `${request.duration_days} days`,
            request.duration_days,
            request.study_style,
            request.difficulty,
            request.audience,
            request.special_requirements || null,
            JSON.stringify(request)
          ]
        );

        // Update status to processing
        await this.updateRequestStatus(request.id, 'processing', 10);
        await this.updateWorkflowStep(request.id, 'planning_phase', 'in_progress');
      }

      // Phase 1: Planning - Create structured study plan
      console.log('🤖 Phase 1: Creating study plan...');
      const studyPlan = await this.createStudyPlan(request);
      
      if (request.id) {
        await this.updateRequestStatus(request.id, 'processing', 40);
        await this.updateWorkflowStep(request.id, 'planning_phase', 'completed');
        await this.updateWorkflowStep(request.id, 'content_generation', 'in_progress');
      }

      // Phase 2: Content Generation - Create detailed content
      console.log('🤖 Phase 2: Generating detailed content...');
      const studyContent = await this.generateDetailedContent(studyPlan);
      
      if (request.id) {
        await this.updateRequestStatus(request.id, 'processing', 70);
        await this.updateWorkflowStep(request.id, 'content_generation', 'completed');
        await this.updateWorkflowStep(request.id, 'file_creation', 'in_progress');
      }

      // Phase 3: File System - Create study files
      console.log('🤖 Phase 3: Creating study files...');
      const studyPath = await this.createStudyFiles(studyPlan, studyContent);
      
      if (request.id) {
        await this.updateRequestStatus(request.id, 'processing', 90);
        await this.updateWorkflowStep(request.id, 'file_creation', 'completed');
      }

      // Phase 4: Database Storage
      console.log('💾 Phase 4: Storing in database...');
      const generatedContent = await this.storeGeneratedContent(request.id || '', studyContent, studyPath);

      // Phase 5: Insert metadata into main studies table
      console.log('📊 Phase 5: Saving study metadata to studies table...');
      await this.insertStudyMetadata(studyPlan);

      if (request.id) {
        await this.updateRequestStatus(request.id, 'completed', 100);
        await this.updateWorkflowStep(request.id, 'completed', 'completed');
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      console.log('✅ Multi-step AI study generation completed successfully');
      console.log(`⏱️ Total time: ${Math.round(duration / 1000)}s`);
      console.log(`📖 Generated ${studyContent.length} days of content`);
      console.log(`🤖 Used model: ${this.getModelConfig(request.study_style).model}`);
      console.log(`📁 Study files created at: ${studyPath}`);

      return {
        status: 'completed',
        progress: 100,
        generatedContent,
        studyPath,
        duration
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('💥 Multi-step AI study generation failed:', errorMessage);

      // Update error status
      if (request.id) {
        await this.updateRequestStatus(request.id, 'failed', 0, errorMessage);
        await this.updateWorkflowStep(request.id, 'failed', 'failed', { error: errorMessage });
      }

      throw error;
    }
  }

  /**
   * Phase 1: Create study plan using structured prompting or mock data
   */
  private async createStudyPlan(request: StudyGenerationRequest): Promise<StudyPlan> {
    try {
      // Validate request
      const validatedRequest = StudyRequestSchema.parse({
        title: request.title,
        topic: request.topic,
        duration_days: request.duration_days,
        difficulty: request.difficulty,
        audience: request.audience,
        study_style: request.study_style,
        special_requirements: request.special_requirements
      });

      // Use mock data if in mock mode
      if (this.mockMode) {
        return await this.createMockStudyPlan(validatedRequest);
      }

      // Use the appropriate prompt template based on study style
      const planningPrompt = PromptTemplateFactory.getPlanningPrompt(validatedRequest);

      // Get appropriate model configuration for this study style
      const modelConfig = this.getModelConfig(validatedRequest.study_style);

      const planningResponse = await this.openai.chat.completions.create({
        model: modelConfig.model,
        messages: [
          {
            role: 'system',
            content: 'You are a Bible study curriculum expert. Always respond with valid JSON in the exact format requested.'
          },
          {
            role: 'user',
            content: planningPrompt
          }
        ],
        temperature: this.config.temperature,
        max_tokens: modelConfig.maxTokens // Use full token allowance for planning
      });

      const planContent = planningResponse.choices[0]?.message?.content;
      if (!planContent) {
        throw new Error('No planning content generated');
      }

      // Log the response for debugging
      console.log('📝 AI Planning Response length:', planContent.length);

      // Parse the OpenAI response using the sophisticated AI response parser
      const aiResponse = AIResponseParser.extractStructuredData(planContent, AIStudyPlanResponseSchema);

      // Use the existing request ID as the study ID for consistency
      const studyId = request.id;

      // Add missing fields from the original request before validation
      const enrichedPlan = {
        ...aiResponse,
        studyId,
        studyStyle: validatedRequest.study_style,
        difficulty: validatedRequest.difficulty,
        audience: validatedRequest.audience
      };

      // Validate the complete plan and return it directly
      const validatedPlan = StudyPlanSchema.parse(enrichedPlan) as StudyPlan;
      return validatedPlan;

    } catch (error) {
      console.error('Error in createStudyPlan:', error);
      throw error;
    }
  }

  /**
   * Phase 2: Generate detailed content for each day
   */
  private async generateDetailedContent(studyPlan: StudyPlan): Promise<DailyStudyContent[]> {
    try {
      const dailyContent: DailyStudyContent[] = [];

      // Use mock data if in mock mode
      if (this.mockMode) {
        return await this.generateMockDetailedContent(studyPlan);
      }

      // Get appropriate model configuration for this study style
      const modelConfig = this.getModelConfig(studyPlan.studyStyle);

      // Generate content for each day
      for (const dayPlan of studyPlan.dailyPlan) {
        console.log(`  📝 Generating content for Day ${dayPlan.day}: ${dayPlan.title} (using ${modelConfig.model})`);

        // Use the appropriate content prompt template based on study style
        const contentPrompt = PromptTemplateFactory.getContentPrompt(studyPlan, dayPlan);

        const contentResponse = await this.openai.chat.completions.create({
          model: modelConfig.model,
          messages: [
            {
              role: 'system',
              content: 'You are a Bible study content expert. Always respond with valid JSON in the exact format requested.'
            },
            {
              role: 'user',
              content: contentPrompt
            }
          ],
          temperature: this.config.temperature,
          max_tokens: modelConfig.maxTokens // Use appropriate token limit for study type
        });

        const dayContentText = contentResponse.choices[0]?.message?.content;
        if (!dayContentText) {
          throw new Error(`No content generated for day ${dayPlan.day}`);
        }

        try {
          // Parse and validate the daily content
          const dayContent = AIResponseParser.extractStructuredData(dayContentText, DailyStudyContentSchema) as DailyStudyContent;

          // Log any missing optional fields (for visibility, not recovery)
          const missingFields = [];
          if (!dayContent.teachingPoint) missingFields.push('teachingPoint');
          if (!dayContent.studyFocus) missingFields.push('studyFocus');
          if (!dayContent.reflectionQuestion) missingFields.push('reflectionQuestion');
          if (!dayContent.prayerFocus) missingFields.push('prayerFocus');
          if (!dayContent.discussionQuestions || dayContent.discussionQuestions.length === 0) missingFields.push('discussionQuestions');
          if (!dayContent.applicationPoints || dayContent.applicationPoints.length === 0) missingFields.push('applicationPoints');

          if (missingFields.length > 0) {
            console.log(`⚠️ Day ${dayPlan.day}: AI omitted fields: ${missingFields.join(', ')}`);
          }

          dailyContent.push(dayContent);
          console.log(`✅ Day ${dayPlan.day} content generated successfully`);

        } catch (error) {
          console.error(`❌ Failed to generate content for Day ${dayPlan.day}:`, (error as Error).message);

          // Log the raw response for debugging
          console.error('Raw AI response that failed validation:', dayContentText.substring(0, 500) + '...');

          throw new Error(`Failed to generate valid content for Day ${dayPlan.day}: ${(error as Error).message}`);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return dailyContent;

    } catch (error) {
      console.error('Error in generateDetailedContent:', error);
      throw error;
    }
  }

  /**
   * Generate detailed content using mock data
   */
  private async generateMockDetailedContent(studyPlan: StudyPlan): Promise<DailyStudyContent[]> {
    // Load mock data if not already loaded
    if (!this.mockData) {
      await this.loadMockData();
    }

    const dailyContent: DailyStudyContent[] = [];

    for (const dayPlan of studyPlan.dailyPlan) {
      console.log(`  📝 Using mock content for Day ${dayPlan.day}: ${dayPlan.title}`);

      let mockDayContent: DailyStudyContent;

      // Use specific mock data if available
      if (this.mockData?.dailyContentResponses?.[`day${dayPlan.day}`]) {
        mockDayContent = this.mockData.dailyContentResponses[`day${dayPlan.day}`];
      } else {
        // Generate fallback mock content
        mockDayContent = {
          day: dayPlan.day,
          title: dayPlan.title,
          estimatedTime: studyPlan.estimatedTimePerSession,
          passages: [
            {
              reference: dayPlan.focusPassage,
              verses: [
                {
                  verse: 1,
                  content: "For sample purposes, this is a mock verse content from the Bible."
                }
              ]
            }
          ],
          studyFocus: `Today's focus is on ${dayPlan.theme} as we explore ${dayPlan.focusPassage}.`,
          teachingPoint: `This day's teaching explores the key theme of ${dayPlan.theme}. ${dayPlan.learningObjective} through understanding God's Word and applying it to our daily lives. The passage ${dayPlan.focusPassage} provides rich insights into how we can grow in faith and trust.`,
          discussionQuestions: [
            `How does ${dayPlan.focusPassage} speak to your current situation?`,
            `What practical steps can you take to apply ${dayPlan.theme} in your life?`,
            `How does this passage connect to the overall theme of ${studyPlan.theme}?`
          ],
          reflectionQuestion: `In what area of your life do you need to apply the lesson from ${dayPlan.focusPassage}?`,
          applicationPoints: dayPlan.keyPoints,
          prayerFocus: `Pray that God would help you to understand and apply the truth of ${dayPlan.theme} in your daily walk.`
        };
      }

      dailyContent.push(mockDayContent);

      // Small delay to simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    return dailyContent;
  }

  /**
   * Phase 3: Create study files in the studies directory
   */
  private async createStudyFiles(studyPlan: StudyPlan, dailyContent: DailyStudyContent[]): Promise<string> {
    try {
      const studyDir = path.join(this.studiesPath, studyPlan.studyId);

      // Create study directory
      await fs.mkdir(studyDir, { recursive: true });

      // Create manifest.json
      const manifestData: StudyManifest = {
        id: studyPlan.studyId,
        title: studyPlan.title,
        theme: studyPlan.theme,
        description: studyPlan.description,
        duration: studyPlan.duration,
        studyStyle: studyPlan.studyStyle,
        difficulty: studyPlan.difficulty,
        audience: studyPlan.audience,
        studyStructure: 'daily',
        estimatedTimePerSession: studyPlan.estimatedTimePerSession,
        pastorMessage: studyPlan.pastorMessage,
        generatedBy: 'AI Multi-Step',
        generationPrompt: `Multi-step AI generated study on: ${studyPlan.theme}`,
        popularity: 0,
        tags: studyPlan.tags,
        status: 'Generated',
        createdDate: new Date().toISOString().split('T')[0],
        lastModified: new Date().toISOString().split('T')[0]
      };

      await fs.writeFile(
        path.join(studyDir, 'manifest.json'),
        JSON.stringify(manifestData, null, 2),
        'utf8'
      );

      // Create daily markdown files
      for (const dayContent of dailyContent) {
        const markdownContent = MarkdownGenerator.generateMarkdownContent(dayContent);
        await fs.writeFile(
          path.join(studyDir, `day-${dayContent.day}.md`),
          markdownContent,
          'utf8'
        );
      }

      console.log(`📁 Study files created successfully at: ${studyDir}`);
      return studyDir;

    } catch (error) {
      console.error('Error creating study files:', error);
      throw error;
    }
  }





  /**
   * Store generated content in database
   */
  private async storeGeneratedContent(
    requestId: string, 
    dailyContent: DailyStudyContent[],
    studyPath: string
  ): Promise<GeneratedStudyContent[]> {
    const generatedContent: GeneratedStudyContent[] = [];

    for (const dayContent of dailyContent) {
      const content: GeneratedStudyContent = {
        request_id: requestId,
        day_number: dayContent.day,
        week_number: Math.ceil(dayContent.day / 7),
        title: dayContent.title,
        theme: dayContent.studyFocus,
        opening_prayer: '', // Could be added to schema if needed
        study_focus: dayContent.studyFocus,
        teaching_content: dayContent.teachingPoint,
        bible_passages: dayContent.passages.map(p => ({ reference: p.reference })),
        discussion_questions: dayContent.discussionQuestions,
        reflection_question: dayContent.reflectionQuestion,
        application_points: dayContent.applicationPoints,
        prayer_focus: dayContent.prayerFocus,
        estimated_time: dayContent.estimatedTime,
        content_data: { ...dayContent, studyPath },
        generation_status: 'completed',
        validation_status: 'approved'
      };

      // Store in database
      await query(
        `INSERT INTO generated_study_content
         (request_id, day_number, week_number, title, theme, opening_prayer,
          study_focus, teaching_content, bible_passages, discussion_questions,
          reflection_question, application_points, prayer_focus, estimated_time,
          content_data, generation_status, validation_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
        [
          requestId,
          content.day_number,
          content.week_number,
          content.title,
          content.theme,
          content.opening_prayer,
          content.study_focus,
          content.teaching_content,
          JSON.stringify(content.bible_passages),
          JSON.stringify(content.discussion_questions),
          content.reflection_question,
          JSON.stringify(content.application_points),
          content.prayer_focus,
          content.estimated_time,
          JSON.stringify(content.content_data),
          content.generation_status,
          content.validation_status
        ]
      );

      generatedContent.push(content);
    }

    return generatedContent;
  }

  /**
   * Insert study metadata into main studies table
   */
  private async insertStudyMetadata(studyPlan: StudyPlan): Promise<void> {
    try {
      await query(
        `INSERT INTO studies (
          id, title, theme, description, duration_days, study_style,
          difficulty, audience, study_structure, estimated_time_per_session,
          pastor_message, generated_by, generation_prompt, popularity,
          tags, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())`,
        [
          studyPlan.studyId,
          studyPlan.title,
          studyPlan.theme,
          studyPlan.description,
          studyPlan.duration,
          studyPlan.studyStyle,
          studyPlan.difficulty,
          studyPlan.audience,
          'daily', // studyStructure - all AI generated are daily for now
          studyPlan.estimatedTimePerSession,
          studyPlan.pastorMessage,
          'AI', // generated_by
          `AI-generated study on: ${studyPlan.theme}`, // generation_prompt
          0, // popularity
          studyPlan.tags,
          'Published' // status - must be 'Published', 'Draft', or 'In Review'
        ]
      );
      console.log(`✅ Study metadata saved to database: ${studyPlan.studyId}`);
    } catch (error) {
      console.error('Error inserting study metadata:', error);
      throw error;
    }
  }

  /**
   * Update request status
   */
  private async updateRequestStatus(
    requestId: string, 
    status: string, 
    progress: number, 
    errorMessage?: string
  ): Promise<void> {
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
  private async updateWorkflowStep(
    requestId: string, 
    step: string, 
    status: string, 
    data: any = {}
  ): Promise<void> {
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