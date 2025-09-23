import { PromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';
import { createOpenAIClient } from '../utils/config.js';

/**
 * Study Planning Agent
 *
 * This agent creates a comprehensive high-level plan for a Bible study,
 * including weekly themes, daily topics, suggested scripture passages,
 * and overall study structure.
 */

// Define the schema for a single day's plan
const dayPlanSchema = z.object({
  dayNumber: z.number().describe('Day number (1-based)'),
  weekNumber: z.number().optional().describe('Week number if applicable'),
  title: z.string().describe('Title for this day\'s study'),
  theme: z.string().describe('Theme or focus for this day'),
  primaryScripture: z.string().describe('Primary Bible passage for this day'),
  supportingScriptures: z.array(z.string()).describe('Additional supporting Bible passages'),
  keyLearningObjective: z.string().describe('What participants should learn this day'),
  suggestedActivities: z.array(z.string()).describe('Suggested activities or discussion points'),
  estimatedTime: z.string().describe('Estimated time needed (e.g., "30 minutes", "1 hour")')
});

// Define the schema for weekly themes (if applicable)
const weekThemeSchema = z.object({
  weekNumber: z.number().describe('Week number'),
  title: z.string().describe('Title for this week'),
  theme: z.string().describe('Overarching theme for the week'),
  learningObjectives: z.array(z.string()).describe('Learning objectives for the week'),
  keyScriptures: z.array(z.string()).describe('Key scriptures for the week')
});

// Define the complete study plan schema
const studyPlanSchema = z.object({
  studyOverview: z.object({
    title: z.string().describe('Final title for the study'),
    description: z.string().describe('Comprehensive description of the study'),
    learningObjectives: z.array(z.string()).describe('Overall learning objectives'),
    keyThemes: z.array(z.string()).describe('Key themes covered in the study'),
    pastorMessage: z.string().describe('Inspirational message from pastor perspective'),
    recommendedResources: z.array(z.string()).describe('Additional recommended resources')
  }).describe('Overall study overview'),

  weeklyThemes: z.array(weekThemeSchema).optional().describe('Weekly themes if study has weekly structure'),

  dailyPlans: z.array(dayPlanSchema).describe('Detailed plan for each day'),

  studyStructure: z.object({
    hasWeeklyFormat: z.boolean().describe('Whether study is organized by weeks'),
    includeGroupDiscussion: z.boolean().describe('Whether to include group discussion elements'),
    includePersonalReflection: z.boolean().describe('Whether to include personal reflection time'),
    includePrayerTime: z.boolean().describe('Whether to include dedicated prayer time'),
    includeApplication: z.boolean().describe('Whether to include practical application'),
    suggestedMeetingFormat: z.string().describe('Suggested format for group meetings if applicable')
  }).describe('Overall structure recommendations'),

  implementationGuidance: z.object({
    facilitatorNotes: z.array(z.string()).describe('Notes for study facilitators'),
    preparationRequirements: z.array(z.string()).describe('What participants need to prepare'),
    materialNeeds: z.array(z.string()).describe('Materials needed for the study'),
    adaptationSuggestions: z.array(z.string()).describe('How to adapt for different contexts')
  }).describe('Implementation guidance')
});

// Create the output parser
const parser = StructuredOutputParser.fromZodSchema(studyPlanSchema);

// Create the prompt template
const promptTemplate = PromptTemplate.fromTemplate(`
You are an expert Bible study curriculum designer with extensive experience in creating engaging, biblically sound, and pedagogically effective study programs for various audiences.

Your task is to create a comprehensive high-level plan for a Bible study based on the following parsed request:

STUDY REQUEST DETAILS:
Title: {title}
Topic: {topic}
Duration: {duration} ({durationDays} days)
Study Style: {studyStyle}
Difficulty: {difficulty}
Audience: {audience}
Key Themes: {keyThemes}
Target Outcomes: {targetOutcomes}
Suggested Structure: {suggestedStructure}
Special Requirements: {specialRequirements}

Please create a detailed study plan that includes:

1. **Study Overview**:
   - Refined title and comprehensive description
   - Clear learning objectives that align with the target outcomes
   - Pastor's inspirational message about the study's importance
   - Recommended additional resources

2. **Weekly Themes** (if applicable):
   - Organize content into logical weekly themes
   - Each week should build upon the previous
   - Include learning objectives and key scriptures for each week

3. **Daily Plans**:
   - Create a specific plan for each of the {durationDays} days
   - Each day should have a clear title, theme, and learning objective
   - Select appropriate primary and supporting Bible passages
   - Suggest activities and discussion points
   - Estimate time requirements

4. **Study Structure**:
   - Define the overall structure and format
   - Include recommendations for group vs. individual elements
   - Specify prayer, reflection, and application components

5. **Implementation Guidance**:
   - Provide facilitator notes and preparation requirements
   - List materials needed
   - Suggest adaptations for different contexts

IMPORTANT GUIDELINES:

**Biblical Accuracy**:
- Select scriptures that are contextually appropriate and theologically sound
- Ensure passages support the daily themes and learning objectives
- Include both well-known and lesser-known passages for variety

**Progressive Learning**:
- Structure the study to build knowledge and understanding progressively
- Start with foundational concepts and advance to deeper applications
- Ensure each day contributes to the overall learning objectives

**Audience Appropriateness**:
- Tailor complexity and content to the specified difficulty level
- Consider the target audience's likely biblical knowledge and experience
- Adjust language and concepts accordingly

**Practical Application**:
- Include opportunities for participants to apply biblical principles
- Provide discussion questions that encourage personal reflection
- Suggest practical activities that reinforce learning

**Engagement and Variety**:
- Vary the types of activities and approaches used
- Include different learning styles (visual, auditory, kinesthetic)
- Balance teaching, discussion, reflection, and application

**Time Management**:
- Provide realistic time estimates for each component
- Consider the audience's available time and attention span
- Allow flexibility for groups with different paces

{format_instructions}

Please create a comprehensive, well-structured study plan:
`);

/**
 * Study Planning Agent Class
 */
export class StudyPlanner {
  constructor() {
    this.llm = createOpenAIClient('studyPlanner');
    this.chain = promptTemplate.pipe(this.llm).pipe(parser);
  }

  /**
   * Create a comprehensive study plan based on parsed request
   * @param {Object} parsedRequest - The structured request from the request parser
   * @returns {Promise<Object>} Comprehensive study plan
   */
  async createStudyPlan(parsedRequest) {
    try {
      console.log('Creating study plan for:', parsedRequest.title);

      // Prepare the prompt with all request details
      const formatInstructions = parser.getFormatInstructions();

      const result = await this.chain.invoke({
        title: parsedRequest.title,
        topic: parsedRequest.topic,
        duration: parsedRequest.duration,
        durationDays: parsedRequest.durationDays,
        studyStyle: parsedRequest.studyStyle,
        difficulty: parsedRequest.difficulty,
        audience: parsedRequest.audience,
        keyThemes: JSON.stringify(parsedRequest.keyThemes),
        targetOutcomes: JSON.stringify(parsedRequest.targetOutcomes),
        suggestedStructure: JSON.stringify(parsedRequest.suggestedStructure),
        specialRequirements: parsedRequest.specialRequirements,
        format_instructions: formatInstructions
      });

      // Validate and enhance the result
      const enhancedResult = this.enhanceStudyPlan(result, parsedRequest);

      console.log('Study plan created successfully:', enhancedResult.studyOverview.title);
      console.log(`Plan includes ${enhancedResult.dailyPlans.length} daily sessions`);

      return enhancedResult;

    } catch (error) {
      console.error('Error creating study plan:', error);
      throw new Error(`Failed to create study plan: ${error.message}`);
    }
  }

  /**
   * Enhance and validate the study plan
   * @param {Object} plan - The generated study plan
   * @param {Object} originalRequest - The original parsed request
   * @returns {Object} Enhanced study plan
   */
  enhanceStudyPlan(plan, originalRequest) {
    // Ensure we have the correct number of daily plans
    if (plan.dailyPlans.length !== originalRequest.durationDays) {
      console.warn(`Plan has ${plan.dailyPlans.length} days but request was for ${originalRequest.durationDays} days`);

      // Adjust if necessary
      if (plan.dailyPlans.length < originalRequest.durationDays) {
        // Add missing days
        for (let i = plan.dailyPlans.length; i < originalRequest.durationDays; i++) {
          plan.dailyPlans.push(this.createDefaultDayPlan(i + 1, originalRequest));
        }
      } else if (plan.dailyPlans.length > originalRequest.durationDays) {
        // Remove extra days
        plan.dailyPlans = plan.dailyPlans.slice(0, originalRequest.durationDays);
      }
    }

    // Ensure day numbers are sequential
    plan.dailyPlans.forEach((day, index) => {
      day.dayNumber = index + 1;

      // Add week number if weekly structure
      if (plan.studyStructure.hasWeeklyFormat) {
        day.weekNumber = Math.ceil((index + 1) / 7);
      }

      // Ensure estimated time is provided
      if (!day.estimatedTime) {
        day.estimatedTime = this.estimateTimeForDay(day, originalRequest);
      }
    });

    // Add metadata
    plan.metadata = {
      generatedAt: new Date().toISOString(),
      originalRequest: originalRequest,
      totalDays: plan.dailyPlans.length,
      totalWeeks: plan.studyStructure.hasWeeklyFormat ? Math.ceil(plan.dailyPlans.length / 7) : null,
      averageTimePerDay: this.calculateAverageTime(plan.dailyPlans)
    };

    return plan;
  }

  /**
   * Create a default day plan as fallback
   * @param {number} dayNumber - Day number
   * @param {Object} request - Original request
   * @returns {Object} Default day plan
   */
  createDefaultDayPlan(dayNumber, request) {
    return {
      dayNumber,
      title: `Day ${dayNumber}: ${request.topic} Study`,
      theme: `Exploring ${request.topic}`,
      primaryScripture: 'Psalm 119:105',
      supportingScriptures: ['2 Timothy 3:16-17'],
      keyLearningObjective: `Continue exploring the topic of ${request.topic}`,
      suggestedActivities: ['Bible reading', 'Reflection', 'Prayer'],
      estimatedTime: '30 minutes'
    };
  }

  /**
   * Estimate time needed for a day's study
   * @param {Object} day - Day plan object
   * @param {Object} request - Original request
   * @returns {string} Estimated time
   */
  estimateTimeForDay(day, request) {
    let baseTime = 20; // Base time in minutes

    // Add time based on difficulty
    if (request.difficulty === 'intermediate') baseTime += 10;
    if (request.difficulty === 'advanced') baseTime += 20;

    // Add time based on audience (groups need more time)
    if (request.audience === 'group') baseTime += 15;
    if (request.audience === 'couples') baseTime += 10;

    // Add time based on activities
    const activityCount = day.suggestedActivities?.length || 0;
    baseTime += activityCount * 5;

    // Round to nearest 5 minutes
    const roundedTime = Math.round(baseTime / 5) * 5;

    return `${roundedTime} minutes`;
  }

  /**
   * Calculate average time per day
   * @param {Array} dailyPlans - Array of daily plans
   * @returns {string} Average time
   */
  calculateAverageTime(dailyPlans) {
    if (!dailyPlans || dailyPlans.length === 0) return '30 minutes';

    const totalMinutes = dailyPlans.reduce((sum, day) => {
      const timeStr = day.estimatedTime || '30 minutes';
      const minutes = parseInt(timeStr.match(/\\d+/)?.[0] || '30');
      return sum + minutes;
    }, 0);

    const averageMinutes = Math.round(totalMinutes / dailyPlans.length);
    return `${averageMinutes} minutes`;
  }

  /**
   * Validate a study plan for completeness and accuracy
   * @param {Object} studyPlan - The study plan to validate
   * @returns {Object} Validation result with isValid boolean and errors array
   */
  validateStudyPlan(studyPlan) {
    const errors = [];

    // Check required sections
    if (!studyPlan.studyOverview) {
      errors.push('Missing study overview section');
    } else {
      if (!studyPlan.studyOverview.title) errors.push('Missing study title');
      if (!studyPlan.studyOverview.description) errors.push('Missing study description');
      if (!studyPlan.studyOverview.learningObjectives?.length) errors.push('Missing learning objectives');
    }

    if (!studyPlan.dailyPlans?.length) {
      errors.push('Missing daily plans');
    } else {
      // Validate each daily plan
      studyPlan.dailyPlans.forEach((day, index) => {
        if (!day.title) errors.push(`Day ${index + 1} missing title`);
        if (!day.theme) errors.push(`Day ${index + 1} missing theme`);
        if (!day.primaryScripture) errors.push(`Day ${index + 1} missing primary scripture`);
        if (!day.keyLearningObjective) errors.push(`Day ${index + 1} missing learning objective`);
      });
    }

    if (!studyPlan.studyStructure) {
      errors.push('Missing study structure');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Create and return a new Study Planner instance
 * @returns {StudyPlanner} New planner instance
 */
export function createStudyPlanner() {
  return new StudyPlanner();
}