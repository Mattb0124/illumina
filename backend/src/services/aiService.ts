import OpenAI from 'openai';
import path from 'path';
import fs from 'fs/promises';
import { query } from '../config/database.js';
import { 
  StudyRequestSchema, 
  StudyPlanSchema, 
  DailyStudyContentSchema,
  StudyManifestSchema,
  type StudyRequest,
  type StudyPlan,
  type DailyStudyContent,
  type StudyManifest
} from '../schemas/studySchemas.js';
import type { StudyGenerationRequest, GeneratedStudyContent } from '../types/index.js';

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
    temperature: number;
    maxTokens: number;
  };

  constructor() {
    // Load configuration from environment variables
    this.config = {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4',
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000')
    };

    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: this.config.apiKey
    });

    this.studiesPath = path.join(process.cwd(), 'studies');

    // Log configuration (without exposing the full API key)
    if (this.config.apiKey) {
      console.log('🔧 AI Service Configuration:');
      console.log(`   Model: ${this.config.model}`);
      console.log(`   Temperature: ${this.config.temperature}`);
      console.log(`   Max Tokens: ${this.config.maxTokens}`);
      console.log(`   API Key: ${this.config.apiKey.substring(0, 8)}...`);
    }
  }

  /**
   * Check if AI service is enabled
   */
  isEnabled(): boolean {
    return !!(this.config.apiKey && this.config.apiKey.startsWith('sk-'));
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
      // Update status to processing
      if (request.id) {
        await this.updateRequestStatus(request.id, 'processing', 10);
        await this.updateWorkflowStep(request.id, 'planning_phase', 'processing');
      }

      // Phase 1: Planning - Create structured study plan
      console.log('🤖 Phase 1: Creating study plan...');
      const studyPlan = await this.createStudyPlan(request);
      
      if (request.id) {
        await this.updateRequestStatus(request.id, 'processing', 40);
        await this.updateWorkflowStep(request.id, 'planning_phase', 'completed');
        await this.updateWorkflowStep(request.id, 'content_generation', 'processing');
      }

      // Phase 2: Content Generation - Create detailed content
      console.log('🤖 Phase 2: Generating detailed content...');
      const studyContent = await this.generateDetailedContent(studyPlan);
      
      if (request.id) {
        await this.updateRequestStatus(request.id, 'processing', 70);
        await this.updateWorkflowStep(request.id, 'content_generation', 'completed');
        await this.updateWorkflowStep(request.id, 'file_creation', 'processing');
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

      if (request.id) {
        await this.updateRequestStatus(request.id, 'completed', 100);
        await this.updateWorkflowStep(request.id, 'completed', 'completed');
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      console.log('✅ Multi-step AI study generation completed successfully');
      console.log(`⏱️ Total time: ${Math.round(duration / 1000)}s`);
      console.log(`📖 Generated ${studyContent.length} days of content`);
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
   * Phase 1: Create study plan using structured prompting
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

      const planningPrompt = `You are a Bible study curriculum planning expert. Create a comprehensive ${validatedRequest.duration_days}-day Bible study plan.

STUDY REQUIREMENTS:
- Title: ${validatedRequest.title}
- Topic: ${validatedRequest.topic}
- Duration: ${validatedRequest.duration_days} days
- Difficulty: ${validatedRequest.difficulty}
- Audience: ${validatedRequest.audience}
- Study Style: ${validatedRequest.study_style}
- Special Requirements: ${validatedRequest.special_requirements || 'None'}

Create a structured plan that includes:
1. Study metadata (title, theme, description, tags)
2. Daily plan with logical progression of themes
3. Specific Bible passages for each day
4. Learning objectives that build upon each other
5. Pastor's message explaining the study's value

IMPORTANT: Respond with valid JSON in this exact format:
{
  "title": "Study title",
  "theme": "Main theme",
  "description": "Study description (2-3 sentences)",
  "duration": ${validatedRequest.duration_days},
  "estimatedTimePerSession": "15-20 minutes",
  "pastorMessage": "Pastor's message about the study's value",
  "tags": ["tag1", "tag2", "tag3"],
  "dailyPlan": [
    {
      "day": 1,
      "title": "Day 1 title",
      "theme": "Day 1 theme",
      "focusPassage": "Bible Reference (e.g., John 3:16)",
      "learningObjective": "What students will learn this day",
      "keyPoints": ["Key point 1", "Key point 2"]
    }
  ]
}

Ensure theological accuracy and appropriate progression for ${validatedRequest.difficulty} level.`;

      const planningResponse = await this.openai.chat.completions.create({
        model: this.config.model,
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
        max_tokens: this.config.maxTokens
      });

      const planContent = planningResponse.choices[0]?.message?.content;
      if (!planContent) {
        throw new Error('No planning content generated');
      }

      // Parse and validate the study plan
      const planData = this.extractStructuredData(planContent, StudyPlanSchema) as StudyPlan;
      
      // Generate study ID and add metadata
      const studyId = this.generateStudyId(validatedRequest.title);
      return {
        studyId,
        title: planData.title,
        theme: planData.theme,
        description: planData.description,
        duration: planData.duration,
        estimatedTimePerSession: planData.estimatedTimePerSession,
        pastorMessage: planData.pastorMessage,
        tags: planData.tags,
        dailyPlan: planData.dailyPlan,
        difficulty: validatedRequest.difficulty,
        audience: validatedRequest.audience,
        studyStyle: validatedRequest.study_style
      };

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

      // Generate content for each day
      for (const dayPlan of studyPlan.dailyPlan) {
        console.log(`  📝 Generating content for Day ${dayPlan.day}: ${dayPlan.title}`);

        const contentPrompt = `You are a Bible study content creation expert. Create detailed daily study content.

STUDY CONTEXT:
- Overall Study: ${studyPlan.title}
- Theme: ${studyPlan.theme}
- Difficulty: ${studyPlan.difficulty}
- Audience: ${studyPlan.audience}
- Estimated Time: ${studyPlan.estimatedTimePerSession}

DAY ${dayPlan.day} REQUIREMENTS:
- Title: ${dayPlan.title}
- Theme: ${dayPlan.theme}
- Focus Passage: ${dayPlan.focusPassage}
- Learning Objective: ${dayPlan.learningObjective}
- Key Points: ${dayPlan.keyPoints.join(', ')}

Create comprehensive daily content with:
1. Clear teaching points explaining biblical concepts
2. 3-4 thoughtful discussion questions
3. 1 personal reflection question  
4. 2-3 practical application points
5. Focused prayer point
6. Bible passages with specific verses

IMPORTANT: Respond with valid JSON in this exact format:
{
  "day": ${dayPlan.day},
  "title": "${dayPlan.title}",
  "estimatedTime": "${studyPlan.estimatedTimePerSession}",
  "passages": [
    {
      "reference": "Bible Reference",
      "verses": [
        {
          "verse": 1,
          "content": "Verse text here"
        }
      ]
    }
  ],
  "studyFocus": "Brief description of what this day focuses on",
  "teachingPoint": "2-3 paragraphs explaining the biblical concepts",
  "discussionQuestions": ["Question 1", "Question 2", "Question 3"],
  "reflectionQuestion": "Personal reflection question",
  "applicationPoints": ["Practical application 1", "Practical application 2"],
  "prayerFocus": "Specific prayer focus for this day"
}

Ensure theological accuracy and practical application.`;

        const contentResponse = await this.openai.chat.completions.create({
          model: this.config.model,
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
          max_tokens: Math.floor(this.config.maxTokens * 0.75) // Use 75% of max tokens for content generation
        });

        const dayContentText = contentResponse.choices[0]?.message?.content;
        if (!dayContentText) {
          throw new Error(`No content generated for day ${dayPlan.day}`);
        }

        // Parse and validate the daily content
        const dayContent = this.extractStructuredData(dayContentText, DailyStudyContentSchema) as DailyStudyContent;
        dailyContent.push(dayContent);

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
        const markdownContent = this.generateMarkdownContent(dayContent);
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
   * Generate markdown content for a daily study
   */
  private generateMarkdownContent(dayContent: DailyStudyContent): string {
    const passagesYaml = dayContent.passages.map(passage => {
      const versesYaml = passage.verses.map(verse => 
        `    - verse: ${verse.verse}\n      content: "${verse.content}"`
      ).join('\n');
      
      return `  - reference: "${passage.reference}"\n    verses:\n${versesYaml}`;
    }).join('\n');

    return `---
day: ${dayContent.day}
title: "${dayContent.title}"
estimatedTime: "${dayContent.estimatedTime}"
passages:
${passagesYaml}
---

# Day ${dayContent.day}: ${dayContent.title}

## Study Focus
${dayContent.studyFocus}

## Teaching Point
${dayContent.teachingPoint}

## Discussion Questions
${dayContent.discussionQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

## Reflection Question
${dayContent.reflectionQuestion}

## Application Points
${dayContent.applicationPoints.map(point => `- ${point}`).join('\n')}

## Prayer Focus
${dayContent.prayerFocus}
`;
  }

  /**
   * Extract structured data from AI response
   */
  private extractStructuredData<T>(content: string, schema: any): T {
    try {
      // Try to find JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return schema.parse(parsed);
      }

      // If no JSON found, try parsing the entire content
      return schema.parse(JSON.parse(content));
    } catch (error) {
      console.error('Failed to extract structured data:', error);
      console.error('Content:', content);
      throw new Error('Failed to parse AI response into structured format');
    }
  }

  /**
   * Generate a study ID from the title
   */
  private generateStudyId(title: string): string {
    return title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50) + '-' + Date.now();
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