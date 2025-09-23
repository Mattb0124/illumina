const { PromptTemplate } = require('@langchain/core/prompts');
const { StructuredOutputParser } = require('langchain/output_parsers');
const { z } = require('zod');
const { createOpenAIClient } = require('../utils/config');

/**
 * Study Request Parser Agent
 *
 * This agent parses user requests for Bible study generation and extracts
 * structured information including topic, duration, difficulty, audience, etc.
 */

// Define the expected output structure using Zod schema
const studyRequestSchema = z.object({
  title: z.string().describe('A descriptive title for the Bible study'),
  topic: z.string().describe('The main topic or theme of the study'),
  duration: z.string().describe('Duration description (e.g., "8 weeks", "30 days", "21 days")'),
  durationDays: z.number().describe('Duration converted to total number of days'),
  studyStyle: z.enum(['devotional', 'topical', 'book-study', 'couples', 'marriage']).describe('Type of Bible study'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).describe('Difficulty level'),
  audience: z.enum(['individual', 'couples', 'group', 'family']).describe('Target audience'),
  specialRequirements: z.string().optional().describe('Any special requirements or preferences'),
  suggestedStructure: z.object({
    hasWeeklyThemes: z.boolean().describe('Whether the study should have weekly themes'),
    dailyFormat: z.boolean().describe('Whether it should have daily components'),
    includeGroupDiscussion: z.boolean().describe('Whether to include group discussion elements'),
    includePrayer: z.boolean().describe('Whether to include prayer components'),
    includeApplication: z.boolean().describe('Whether to include practical application')
  }).describe('Suggested structure for the study'),
  keyThemes: z.array(z.string()).describe('Key themes to cover in the study'),
  targetOutcomes: z.array(z.string()).describe('What participants should learn or achieve')
});

// Create the output parser
const parser = StructuredOutputParser.fromZodSchema(studyRequestSchema);

// Create the prompt template
const promptTemplate = PromptTemplate.fromTemplate(`
You are a Bible study curriculum expert who specializes in creating structured, biblically sound study programs.

Your task is to analyze a user's request for a Bible study and extract detailed, structured information that will be used to generate a comprehensive study curriculum.

USER REQUEST: {userRequest}

Based on this request, please extract and determine the following information:

1. **Title**: Create a compelling, descriptive title for this Bible study
2. **Topic**: Identify the main biblical topic or theme
3. **Duration**: Extract or infer the duration (if not specified, suggest appropriate duration based on topic complexity)
4. **Duration in Days**: Convert the duration to total number of days
5. **Study Style**: Determine the most appropriate study style based on the request
6. **Difficulty Level**: Assess appropriate difficulty level based on topic complexity and user indication
7. **Target Audience**: Determine who this study is intended for
8. **Special Requirements**: Note any specific requirements, preferences, or constraints mentioned
9. **Suggested Structure**: Recommend structural elements for this study
10. **Key Themes**: Identify 3-5 key themes that should be covered
11. **Target Outcomes**: Define 3-5 learning outcomes participants should achieve

IMPORTANT GUIDELINES:
- If duration is not specified, suggest appropriate duration based on topic depth (typically 7-56 days)
- For marriage/relationship topics, default to 'couples' audience and 'marriage' or 'couples' style
- For complex theological topics, lean toward 'intermediate' or 'advanced' difficulty
- For basic Christian living topics, 'beginner' is often appropriate
- Always include prayer and application components unless specifically excluded
- Consider the target audience when determining structure and complexity

{format_instructions}

Please analyze the request carefully and provide structured output:
`);

/**
 * Study Request Parser Agent Class
 */
export class StudyRequestParser {
  constructor() {
    this.llm = createOpenAIClient('requestParser');
    this.chain = promptTemplate.pipe(this.llm).pipe(parser);
  }

  /**
   * Parse a user request and extract structured study information
   * @param {string} userRequest - The raw user request
   * @returns {Promise<Object>} Structured study request data
   */
  async parseRequest(userRequest) {
    try {
      console.log('Parsing study request:', userRequest);

      // Prepare the prompt with format instructions
      const formatInstructions = parser.getFormatInstructions();

      const result = await this.chain.invoke({
        userRequest: userRequest.trim(),
        format_instructions: formatInstructions
      });

      // Validate and enhance the result
      const enhancedResult = this.enhanceResult(result);

      console.log('Parsed study request successfully:', enhancedResult.title);
      return enhancedResult;

    } catch (error) {
      console.error('Error parsing study request:', error);
      throw new Error(`Failed to parse study request: ${error.message}`);
    }
  }

  /**
   * Enhance and validate the parsed result
   * @param {Object} result - The parsed result from the LLM
   * @returns {Object} Enhanced and validated result
   */
  enhanceResult(result) {
    // Ensure duration days is calculated correctly
    if (!result.durationDays || result.durationDays <= 0) {
      result.durationDays = this.parseDurationToDays(result.duration);
    }

    // Set default special requirements if empty
    if (!result.specialRequirements) {
      result.specialRequirements = 'Standard Bible study format with prayer and application';
    }

    // Ensure we have key themes
    if (!result.keyThemes || result.keyThemes.length === 0) {
      result.keyThemes = ['Biblical Foundation', 'Practical Application', 'Spiritual Growth'];
    }

    // Ensure we have target outcomes
    if (!result.targetOutcomes || result.targetOutcomes.length === 0) {
      result.targetOutcomes = [
        'Deepen understanding of biblical principles',
        'Apply biblical truths to daily life',
        'Strengthen relationship with God'
      ];
    }

    return result;
  }

  /**
   * Convert duration string to number of days
   * @param {string} duration - Duration string (e.g., "8 weeks", "30 days")
   * @returns {number} Number of days
   */
  parseDurationToDays(duration) {
    if (!duration) return 30; // Default to 30 days

    const lowerDuration = duration.toLowerCase();

    // Extract numbers from the string
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
      // If no unit specified, assume days
      return value;
    }
  }

  /**
   * Validate a parsed request for completeness and accuracy
   * @param {Object} parsedRequest - The parsed request object
   * @returns {Object} Validation result with isValid boolean and errors array
   */
  validateParsedRequest(parsedRequest) {
    const errors = [];

    // Required fields validation
    const requiredFields = ['title', 'topic', 'duration', 'durationDays', 'studyStyle', 'difficulty', 'audience'];
    for (const field of requiredFields) {
      if (!parsedRequest[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Duration validation
    if (parsedRequest.durationDays && (parsedRequest.durationDays < 1 || parsedRequest.durationDays > 365)) {
      errors.push('Duration days must be between 1 and 365');
    }

    // Study style validation
    const validStudyStyles = ['devotional', 'topical', 'book-study', 'couples', 'marriage'];
    if (parsedRequest.studyStyle && !validStudyStyles.includes(parsedRequest.studyStyle)) {
      errors.push(`Invalid study style: ${parsedRequest.studyStyle}`);
    }

    // Difficulty validation
    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    if (parsedRequest.difficulty && !validDifficulties.includes(parsedRequest.difficulty)) {
      errors.push(`Invalid difficulty: ${parsedRequest.difficulty}`);
    }

    // Audience validation
    const validAudiences = ['individual', 'couples', 'group', 'family'];
    if (parsedRequest.audience && !validAudiences.includes(parsedRequest.audience)) {
      errors.push(`Invalid audience: ${parsedRequest.audience}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Create and return a new Study Request Parser instance
 * @returns {StudyRequestParser} New parser instance
 */
function createStudyRequestParser() {
  return new StudyRequestParser();
}

module.exports = {
  createStudyRequestParser
};