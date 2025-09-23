const { PromptTemplate } = require('@langchain/core/prompts');
const { StructuredOutputParser } = require('langchain/output_parsers');
const { z } = require('zod');
const { createOpenAIClient } = require('../utils/config.js');

/**
 * Content Generation Agent
 *
 * This agent generates detailed content for individual study days,
 * including opening prayers, teaching content, discussion questions,
 * reflection prompts, application points, and prayer focuses.
 */

// Define the schema for generated daily content
const dailyContentSchema = z.object({
  openingPrayer: z.string().describe('An inspiring opening prayer for this day\'s study'),

  studyIntroduction: z.string().describe('Brief introduction to set the context for today\'s study'),

  teachingContent: z.object({
    mainTeaching: z.string().describe('Primary teaching content explaining the biblical principles'),
    keyPoints: z.array(z.string()).describe('3-5 key points that summarize the main teaching'),
    scriptureExplanation: z.string().describe('Detailed explanation of the primary scripture passage'),
    historicalContext: z.string().describe('Historical and cultural context of the scripture'),
    modernApplication: z.string().describe('How these principles apply to modern life')
  }).describe('Comprehensive teaching content'),

  discussionQuestions: z.array(z.object({
    question: z.string().describe('The discussion question'),
    purpose: z.string().describe('What this question is designed to achieve'),
    expectedAnswers: z.array(z.string()).describe('Examples of thoughtful answers')
  })).describe('5-7 discussion questions for group or personal reflection'),

  reflectionPrompts: z.object({
    personalReflection: z.string().describe('Personal reflection question for individual contemplation'),
    journalPrompt: z.string().describe('Writing prompt for personal journaling'),
    meditationFocus: z.string().describe('Focus point for meditation on the day\'s theme')
  }).describe('Personal reflection components'),

  practicalApplication: z.object({
    dailyChallenge: z.string().describe('A specific challenge or action for participants to take'),
    applicationSteps: z.array(z.string()).describe('Step-by-step guidance for applying the teaching'),
    realLifeExamples: z.array(z.string()).describe('Real-life examples of how to live out these principles'),
    weeklyGoal: z.string().describe('A goal participants can work toward this week')
  }).describe('Practical application components'),

  closingPrayer: z.string().describe('A closing prayer that reinforces the day\'s themes and lessons'),

  additionalResources: z.object({
    relatedScriptures: z.array(z.string()).describe('Additional Bible passages for further study'),
    recommendedReading: z.array(z.string()).describe('Books, articles, or resources for deeper exploration'),
    supplementalActivities: z.array(z.string()).describe('Optional activities to enhance learning')
  }).describe('Additional resources for deeper study'),

  facilitatorNotes: z.object({
    preparationTips: z.array(z.string()).describe('Tips for facilitators to prepare for this session'),
    timeManagement: z.string().describe('Guidance on managing time during the session'),
    commonChallenges: z.array(z.string()).describe('Common challenges participants might face'),
    adaptationSuggestions: z.array(z.string()).describe('How to adapt content for different contexts')
  }).describe('Notes and guidance for study facilitators')
});

// Create the output parser
const parser = StructuredOutputParser.fromZodSchema(dailyContentSchema);

// Create the prompt template
const promptTemplate = PromptTemplate.fromTemplate(`
You are an expert Bible teacher and curriculum developer with deep theological knowledge and extensive experience in creating engaging, transformative Bible study content.

Your task is to create comprehensive, detailed content for a single day of Bible study based on the provided day plan and overall study context.

OVERALL STUDY CONTEXT:
Study Title: {studyTitle}
Study Topic: {studyTopic}
Study Style: {studyStyle}
Difficulty Level: {difficulty}
Target Audience: {audience}
Study Description: {studyDescription}

TODAY'S DAY PLAN:
Day Number: {dayNumber}
Title: {dayTitle}
Theme: {dayTheme}
Primary Scripture: {primaryScripture}
Supporting Scriptures: {supportingScriptures}
Key Learning Objective: {keyLearningObjective}
Suggested Activities: {suggestedActivities}
Estimated Time: {estimatedTime}

CONTENT GENERATION GUIDELINES:

**Biblical Foundation**:
- Ensure all content is grounded in sound biblical theology
- Use proper hermeneutical principles when interpreting scripture
- Provide accurate historical and cultural context
- Connect Old and New Testament themes appropriately
- Maintain doctrinal accuracy throughout

**Educational Excellence**:
- Create content that builds progressively on previous days
- Use age-appropriate language and concepts for the target audience
- Include multiple learning styles (visual, auditory, kinesthetic)
- Provide clear explanations with practical examples
- Structure content logically from introduction to application

**Engagement and Relevance**:
- Make biblical principles relevant to contemporary life
- Include real-world examples and modern applications
- Create discussion questions that encourage deep thinking
- Provide opportunities for personal reflection and growth
- Include practical challenges that participants can implement

**Spiritual Formation**:
- Foster genuine spiritual growth and transformation
- Encourage personal relationship with God
- Promote biblical values and character development
- Include opportunities for prayer and worship
- Support community building and fellowship

**Practical Considerations**:
- Respect the estimated time constraints
- Provide options for different group sizes and contexts
- Include facilitator guidance for smooth implementation
- Suggest adaptations for various learning environments
- Offer additional resources for deeper exploration

SPECIFIC CONTENT REQUIREMENTS:

1. **Opening Prayer**: Create a meaningful prayer that:
   - Invites God's presence into the study time
   - Prepares hearts to receive biblical truth
   - Connects to the day's theme and learning objectives
   - Is appropriate for the target audience and context

2. **Teaching Content**: Develop comprehensive teaching that:
   - Explains the primary scripture passage thoroughly
   - Provides necessary historical and cultural background
   - Connects the passage to the overall study theme
   - Offers clear, practical applications for modern life
   - Includes key points that participants can remember and apply

3. **Discussion Questions**: Create thought-provoking questions that:
   - Encourage deep biblical reflection
   - Promote meaningful group interaction
   - Help participants apply truths to their own lives
   - Accommodate different levels of biblical knowledge
   - Build community and foster sharing

4. **Reflection Components**: Design personal reflection elements that:
   - Encourage individual contemplation and prayer
   - Provide journaling opportunities for personal growth
   - Support meditation on biblical truths
   - Help participants internalize the day's lessons

5. **Practical Application**: Develop actionable application that:
   - Provides specific, achievable challenges
   - Offers step-by-step guidance for implementation
   - Includes real-life examples and scenarios
   - Supports long-term character development and growth

6. **Facilitator Support**: Create helpful resources that:
   - Prepare facilitators for successful sessions
   - Address common challenges and questions
   - Provide timing and pacing guidance
   - Suggest adaptations for different contexts

Remember: This content should be theologically sound, educationally effective, spiritually transformative, and practically applicable. The goal is to help participants grow in their faith and understanding while building stronger relationships with God and each other.

{format_instructions}

Please generate comprehensive, detailed content for this day's study:
`);

/**
 * Content Generation Agent Class
 */
class ContentGenerator {
  constructor() {
    this.llm = createOpenAIClient('contentGenerator');
    this.chain = promptTemplate.pipe(this.llm).pipe(parser);
  }

  /**
   * Generate detailed content for a single day of study
   * @param {Object} dayPlan - The day plan from the study planner
   * @param {Object} studyContext - Overall study context
   * @returns {Promise<Object>} Generated daily content
   */
  async generateDayContent(dayPlan, studyContext) {
    try {
      console.log(`Generating content for Day ${dayPlan.dayNumber}: ${dayPlan.title}`);

      // Prepare the prompt with all context
      const formatInstructions = parser.getFormatInstructions();

      const result = await this.chain.invoke({
        // Study context
        studyTitle: studyContext.title,
        studyTopic: studyContext.topic,
        studyStyle: studyContext.studyStyle,
        difficulty: studyContext.difficulty,
        audience: studyContext.audience,
        studyDescription: studyContext.description,

        // Day-specific details
        dayNumber: dayPlan.dayNumber,
        dayTitle: dayPlan.title,
        dayTheme: dayPlan.theme,
        primaryScripture: dayPlan.primaryScripture,
        supportingScriptures: JSON.stringify(dayPlan.supportingScriptures || []),
        keyLearningObjective: dayPlan.keyLearningObjective,
        suggestedActivities: JSON.stringify(dayPlan.suggestedActivities || []),
        estimatedTime: dayPlan.estimatedTime,

        format_instructions: formatInstructions
      });

      // Enhance and validate the result
      const enhancedResult = this.enhanceGeneratedContent(result, dayPlan, studyContext);

      console.log(`Content generated successfully for Day ${dayPlan.dayNumber}`);
      return enhancedResult;

    } catch (error) {
      console.error(`Error generating content for Day ${dayPlan.dayNumber}:`, error);
      throw new Error(`Failed to generate content for Day ${dayPlan.dayNumber}: ${error.message}`);
    }
  }

  /**
   * Generate content for multiple days concurrently
   * @param {Array} dayPlans - Array of day plans
   * @param {Object} studyContext - Overall study context
   * @param {number} concurrency - Maximum concurrent generations (default: 3)
   * @returns {Promise<Array>} Array of generated content
   */
  async generateMultipleDaysContent(dayPlans, studyContext, concurrency = 3) {
    console.log(`Generating content for ${dayPlans.length} days with concurrency: ${concurrency}`);

    const results = [];

    // Process in batches to control concurrency
    for (let i = 0; i < dayPlans.length; i += concurrency) {
      const batch = dayPlans.slice(i, i + concurrency);
      console.log(`Processing batch ${Math.floor(i / concurrency) + 1}: Days ${batch[0].dayNumber}-${batch[batch.length - 1].dayNumber}`);

      const batchPromises = batch.map(dayPlan =>
        this.generateDayContent(dayPlan, studyContext)
          .catch(error => ({
            dayNumber: dayPlan.dayNumber,
            error: error.message,
            fallbackContent: this.createFallbackContent(dayPlan, studyContext)
          }))
      );

      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Small delay between batches to avoid overwhelming the API
        if (i + concurrency < dayPlans.length) {
          await this.delay(1000);
        }
      } catch (error) {
        console.error(`Error processing batch ${Math.floor(i / concurrency) + 1}:`, error);
        // Add fallback content for failed batch
        batch.forEach(dayPlan => {
          results.push({
            dayNumber: dayPlan.dayNumber,
            error: error.message,
            fallbackContent: this.createFallbackContent(dayPlan, studyContext)
          });
        });
      }
    }

    const successCount = results.filter(r => !r.error).length;
    console.log(`Content generation complete: ${successCount}/${results.length} days successful`);

    return results;
  }

  /**
   * Enhance generated content with additional metadata and validation
   * @param {Object} content - Generated content
   * @param {Object} dayPlan - Original day plan
   * @param {Object} studyContext - Study context
   * @returns {Object} Enhanced content
   */
  enhanceGeneratedContent(content, dayPlan, studyContext) {
    // Add metadata
    content.metadata = {
      dayNumber: dayPlan.dayNumber,
      weekNumber: dayPlan.weekNumber,
      generatedAt: new Date().toISOString(),
      estimatedTime: dayPlan.estimatedTime,
      primaryScripture: dayPlan.primaryScripture,
      supportingScriptures: dayPlan.supportingScriptures || []
    };

    // Ensure all required sections are present
    if (!content.openingPrayer) {
      content.openingPrayer = this.generateFallbackPrayer('opening', dayPlan.theme);
    }

    if (!content.closingPrayer) {
      content.closingPrayer = this.generateFallbackPrayer('closing', dayPlan.theme);
    }

    // Validate discussion questions
    if (!content.discussionQuestions || content.discussionQuestions.length < 3) {
      content.discussionQuestions = this.generateFallbackQuestions(dayPlan);
    }

    // Add content statistics
    content.statistics = {
      wordCount: this.calculateWordCount(content),
      readingTime: this.estimateReadingTime(content),
      questionCount: content.discussionQuestions?.length || 0
    };

    return content;
  }

  /**
   * Create fallback content when generation fails
   * @param {Object} dayPlan - Day plan
   * @param {Object} studyContext - Study context
   * @returns {Object} Fallback content
   */
  createFallbackContent(dayPlan, studyContext) {
    return {
      openingPrayer: this.generateFallbackPrayer('opening', dayPlan.theme),

      studyIntroduction: `Welcome to Day ${dayPlan.dayNumber} of our study on ${studyContext.topic}. Today we'll explore ${dayPlan.theme} through the lens of Scripture.`,

      teachingContent: {
        mainTeaching: `Today's focus is on ${dayPlan.theme}. We'll examine ${dayPlan.primaryScripture} to understand ${dayPlan.keyLearningObjective}.`,
        keyPoints: [
          'Scripture provides guidance for our daily lives',
          'God\'s word is relevant to our contemporary challenges',
          'Biblical principles can transform our perspective'
        ],
        scriptureExplanation: `${dayPlan.primaryScripture} teaches us important truths about ${dayPlan.theme}.`,
        historicalContext: 'This passage was written in a specific historical context that helps us understand its meaning.',
        modernApplication: 'These biblical principles apply to our lives today in practical ways.'
      },

      discussionQuestions: this.generateFallbackQuestions(dayPlan),

      reflectionPrompts: {
        personalReflection: `How does today's study on ${dayPlan.theme} apply to your life?`,
        journalPrompt: `Write about a time when you experienced God's guidance in an area related to ${dayPlan.theme}.`,
        meditationFocus: `Meditate on ${dayPlan.primaryScripture} and its meaning for your life.`
      },

      practicalApplication: {
        dailyChallenge: `Apply one principle from today's study on ${dayPlan.theme} in your daily life.`,
        applicationSteps: [
          'Reflect on the scripture passage',
          'Identify one practical application',
          'Take action to implement this truth',
          'Pray for God\'s help in living it out'
        ],
        realLifeExamples: ['Personal relationships', 'Work situations', 'Family interactions'],
        weeklyGoal: `This week, focus on living out the principles of ${dayPlan.theme}.`
      },

      closingPrayer: this.generateFallbackPrayer('closing', dayPlan.theme),

      additionalResources: {
        relatedScriptures: dayPlan.supportingScriptures || [],
        recommendedReading: ['Bible commentary on this passage', 'Devotional books on related topics'],
        supplementalActivities: ['Scripture memorization', 'Discussion with a friend', 'Additional Bible reading']
      },

      facilitatorNotes: {
        preparationTips: ['Read the passage multiple times', 'Prepare personal examples', 'Review discussion questions'],
        timeManagement: `This session is designed for ${dayPlan.estimatedTime}. Adjust as needed for your group.`,
        commonChallenges: ['Different levels of biblical knowledge', 'Varying comfort with sharing', 'Time management'],
        adaptationSuggestions: ['Adjust language for age groups', 'Provide additional context as needed', 'Allow for flexible timing']
      },

      metadata: {
        dayNumber: dayPlan.dayNumber,
        weekNumber: dayPlan.weekNumber,
        generatedAt: new Date().toISOString(),
        estimatedTime: dayPlan.estimatedTime,
        primaryScripture: dayPlan.primaryScripture,
        isFallback: true
      }
    };
  }

  /**
   * Generate fallback prayer content
   * @param {string} type - 'opening' or 'closing'
   * @param {string} theme - Day's theme
   * @returns {string} Prayer content
   */
  generateFallbackPrayer(type, theme) {
    if (type === 'opening') {
      return `Heavenly Father, we come before You today with grateful hearts, ready to learn from Your Word. Please open our minds and hearts as we study ${theme}. Help us to understand Your truth and apply it to our lives. Guide our discussion and draw us closer to You. In Jesus' name, Amen.`;
    } else {
      return `Lord, thank You for this time in Your Word studying ${theme}. Help us to remember what we've learned and to live it out in our daily lives. May Your Spirit continue to work in our hearts throughout this week. Bless us as we go from this place. In Jesus' name, Amen.`;
    }
  }

  /**
   * Generate fallback discussion questions
   * @param {Object} dayPlan - Day plan
   * @returns {Array} Discussion questions
   */
  generateFallbackQuestions(dayPlan) {
    return [
      {
        question: `What stands out to you most from ${dayPlan.primaryScripture}?`,
        purpose: 'Initial engagement with the text',
        expectedAnswers: ['Specific verses or phrases', 'Overall themes', 'Personal connections']
      },
      {
        question: `How does this passage relate to ${dayPlan.theme}?`,
        purpose: 'Connect scripture to the day\'s theme',
        expectedAnswers: ['Direct connections', 'Underlying principles', 'Practical applications']
      },
      {
        question: 'What questions does this passage raise for you?',
        purpose: 'Encourage deeper thinking and exploration',
        expectedAnswers: ['Clarification questions', 'Application concerns', 'Theological inquiries']
      },
      {
        question: 'How can you apply this teaching in your life this week?',
        purpose: 'Personal application and commitment',
        expectedAnswers: ['Specific actions', 'Attitude changes', 'Relationship improvements']
      }
    ];
  }

  /**
   * Calculate approximate word count of generated content
   * @param {Object} content - Generated content
   * @returns {number} Word count
   */
  calculateWordCount(content) {
    const textContent = JSON.stringify(content);
    return textContent.split(/\\s+/).length;
  }

  /**
   * Estimate reading time for content
   * @param {Object} content - Generated content
   * @returns {string} Estimated reading time
   */
  estimateReadingTime(content) {
    const wordCount = this.calculateWordCount(content);
    const minutesPerWord = 200; // Average reading speed
    const minutes = Math.ceil(wordCount / minutesPerWord);
    return `${minutes} minutes`;
  }

  /**
   * Utility function for delays
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate generated content for completeness
   * @param {Object} content - Generated content
   * @returns {Object} Validation result
   */
  validateGeneratedContent(content) {
    const errors = [];
    const requiredSections = [
      'openingPrayer', 'studyIntroduction', 'teachingContent',
      'discussionQuestions', 'reflectionPrompts', 'practicalApplication', 'closingPrayer'
    ];

    requiredSections.forEach(section => {
      if (!content[section]) {
        errors.push(`Missing required section: ${section}`);
      }
    });

    // Validate discussion questions
    if (content.discussionQuestions && content.discussionQuestions.length < 3) {
      errors.push('Insufficient discussion questions (minimum 3 required)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      completeness: ((requiredSections.length - errors.length) / requiredSections.length) * 100
    };
  }
}

/**
 * Create and return a new Content Generator instance
 * @returns {ContentGenerator} New generator instance
 */
function createContentGenerator() {
  return new ContentGenerator();
}

module.exports = {
  ContentGenerator,
  createContentGenerator
};