const { PromptTemplate } = require('@langchain/core/prompts');
const { StructuredOutputParser } = require('langchain/output_parsers');
const { z } = require('zod');
const { createOpenAIClient } = require('../utils/config.js');

/**
 * Theological Validation Agent
 *
 * This agent reviews generated Bible study content for theological accuracy,
 * biblical soundness, doctrinal consistency, and appropriate application
 * of biblical principles.
 */

// Define validation result schema for individual content sections
const sectionValidationSchema = z.object({
  section: z.string().describe('Name of the content section being validated'),
  isValid: z.boolean().describe('Whether this section is theologically sound'),
  accuracy: z.enum(['excellent', 'good', 'acceptable', 'concerning', 'problematic']).describe('Level of theological accuracy'),
  issues: z.array(z.string()).describe('Specific theological or biblical issues found'),
  suggestions: z.array(z.string()).describe('Suggestions for improvement'),
  strengths: z.array(z.string()).describe('Theological strengths in this section')
});

// Define overall validation result schema
const validationResultSchema = z.object({
  overallAssessment: z.object({
    isApproved: z.boolean().describe('Whether the content is approved for use'),
    overallRating: z.enum(['excellent', 'good', 'acceptable', 'needs_revision', 'rejected']).describe('Overall theological quality rating'),
    confidence: z.number().min(0).max(100).describe('Confidence level in this assessment (0-100)'),
    majorConcerns: z.array(z.string()).describe('Major theological concerns that must be addressed'),
    recommendedActions: z.array(z.string()).describe('Recommended actions before approval')
  }).describe('Overall assessment of the content'),

  sectionValidations: z.array(sectionValidationSchema).describe('Detailed validation of each content section'),

  scriptureValidation: z.object({
    contextualAccuracy: z.enum(['excellent', 'good', 'acceptable', 'poor']).describe('How well scriptures are used in context'),
    hermeneuticalSoundness: z.enum(['excellent', 'good', 'acceptable', 'poor']).describe('Quality of biblical interpretation'),
    applicationAppropriate: z.boolean().describe('Whether modern applications are appropriate'),
    missingContext: z.array(z.string()).describe('Important context that should be added'),
    questionableInterpretations: z.array(z.string()).describe('Interpretations that may be questionable')
  }).describe('Validation of scripture usage and interpretation'),

  doctrinalConsistency: z.object({
    orthodoxTeaching: z.boolean().describe('Whether content aligns with orthodox Christian teaching'),
    denominationalNeutrality: z.boolean().describe('Whether content avoids controversial denominational positions'),
    balancedPresentation: z.boolean().describe('Whether different perspectives are presented fairly'),
    potentialControversies: z.array(z.string()).describe('Topics that might be controversial'),
    clarificationsNeeded: z.array(z.string()).describe('Areas that need doctrinal clarification')
  }).describe('Assessment of doctrinal consistency'),

  practicalApplication: z.object({
    realistic: z.boolean().describe('Whether applications are realistic and achievable'),
    culturallySensitive: z.boolean().describe('Whether applications are culturally appropriate'),
    ageAppropriate: z.boolean().describe('Whether content matches the target audience'),
    spirituallyMature: z.boolean().describe('Whether applications promote spiritual maturity'),
    impracticalSuggestions: z.array(z.string()).describe('Applications that may be impractical'),
    missingApplications: z.array(z.string()).describe('Important applications that are missing')
  }).describe('Assessment of practical applications'),

  validationNotes: z.object({
    reviewerComments: z.string().describe('Overall comments from the theological reviewer'),
    strengthsHighlighted: z.array(z.string()).describe('Key strengths to highlight'),
    improvementPriorities: z.array(z.string()).describe('Priority areas for improvement'),
    followUpQuestions: z.array(z.string()).describe('Questions for content creators to consider'),
    additionalResources: z.array(z.string()).describe('Resources that might help improve the content')
  }).describe('Additional validation notes and feedback')
});

// Create the output parser
const parser = StructuredOutputParser.fromZodSchema(validationResultSchema);

// Create the prompt template
const promptTemplate = PromptTemplate.fromTemplate(`
You are a senior pastor and biblical theologian with extensive training in systematic theology, biblical hermeneutics, and Christian education. You have decades of experience in theological education and have been asked to review Bible study content for accuracy, orthodoxy, and practical application.

Your task is to conduct a comprehensive theological validation of the provided Bible study content, examining it for biblical accuracy, doctrinal soundness, appropriate application, and spiritual maturity.

CONTENT TO VALIDATE:

Study Context:
- Title: {studyTitle}
- Topic: {studyTopic}
- Day: {dayNumber} - {dayTitle}
- Theme: {dayTheme}
- Primary Scripture: {primaryScripture}
- Target Audience: {audience}
- Difficulty Level: {difficulty}

Content Sections to Review:
1. Opening Prayer: {openingPrayer}

2. Study Introduction: {studyIntroduction}

3. Teaching Content:
   Main Teaching: {mainTeaching}
   Scripture Explanation: {scriptureExplanation}
   Historical Context: {historicalContext}
   Modern Application: {modernApplication}

4. Discussion Questions: {discussionQuestions}

5. Practical Application: {practicalApplication}

6. Closing Prayer: {closingPrayer}

VALIDATION CRITERIA:

**Biblical Accuracy and Hermeneutics**:
- Are scriptures interpreted correctly within their historical and literary context?
- Are proper hermeneutical principles applied (grammatical-historical method)?
- Are cross-references and supporting passages appropriate and accurate?
- Is the distinction between description and prescription maintained?
- Are cultural and historical contexts properly explained?

**Doctrinal Orthodoxy**:
- Does content align with historic Christian orthodoxy and essential doctrines?
- Are fundamental truths (Trinity, salvation by grace, biblical authority) upheld?
- Are potential heresies or doctrinal errors avoided?
- Is denominational neutrality maintained on secondary issues?
- Are controversial topics handled with appropriate balance and sensitivity?

**Theological Consistency**:
- Is the theology internally consistent throughout the content?
- Do applications flow logically from biblical principles?
- Are God's attributes and character represented accurately?
- Is the Gospel clearly present where appropriate?
- Are biblical themes and typology used correctly?

**Spiritual Formation**:
- Does content promote genuine spiritual growth and maturity?
- Are participants encouraged toward Christlikeness?
- Is personal relationship with God emphasized appropriately?
- Are spiritual disciplines presented biblically?
- Does content foster healthy Christian community?

**Practical Application**:
- Are applications realistic and achievable for the target audience?
- Do practical suggestions align with biblical principles?
- Are cultural and contextual factors considered appropriately?
- Are different life situations and circumstances addressed?
- Is grace balanced with truth in applications?

**Educational Excellence**:
- Is content age-appropriate and accessible to the target audience?
- Are complex theological concepts explained clearly?
- Is progressive learning and skill development supported?
- Are different learning styles and backgrounds considered?
- Are discussion questions thought-provoking and appropriate?

**Pastoral Sensitivity**:
- Does content demonstrate pastoral care and sensitivity?
- Are difficult topics handled with appropriate gentleness?
- Is hope and encouragement balanced with challenge?
- Are hurting or struggling people considered in applications?
- Is church unity and fellowship promoted?

VALIDATION PROCESS:

1. **Section-by-Section Review**: Examine each content section for theological accuracy, biblical soundness, and appropriate application.

2. **Scripture Analysis**: Evaluate how biblical passages are interpreted, applied, and contextualized.

3. **Doctrinal Assessment**: Check for alignment with orthodox Christian teaching and appropriate handling of theological concepts.

4. **Application Evaluation**: Assess whether practical applications are realistic, biblical, and appropriate for the target audience.

5. **Overall Integration**: Determine how well all elements work together to create sound, edifying content.

RATING SCALE:
- **Excellent**: Exceptionally sound theology with masterful application
- **Good**: Solid theological foundation with effective practical application
- **Acceptable**: Generally sound with minor areas for improvement
- **Needs Revision**: Significant issues that must be addressed before use
- **Rejected**: Major theological errors or inappropriate content requiring complete rework

Please provide a thorough, constructive review that helps ensure this Bible study content is theologically sound, biblically accurate, and spiritually edifying for participants.

{format_instructions}

Conduct your theological validation:
`);

/**
 * Theological Validation Agent Class
 */
class TheologicalValidator {
  constructor() {
    this.llm = createOpenAIClient('theologicalValidator');
    this.chain = promptTemplate.pipe(this.llm).pipe(parser);
  }

  /**
   * Validate the theological content of a single day's study
   * @param {Object} dayContent - Generated content for validation
   * @param {Object} studyContext - Overall study context
   * @returns {Promise<Object>} Validation result
   */
  async validateDayContent(dayContent, studyContext) {
    try {
      console.log(`Validating theological content for Day ${dayContent.metadata?.dayNumber}: ${studyContext.title}`);

      // Prepare content for validation
      const formatInstructions = parser.getFormatInstructions();

      const result = await this.chain.invoke({
        // Study context
        studyTitle: studyContext.title,
        studyTopic: studyContext.topic,
        dayNumber: dayContent.metadata?.dayNumber || 'Unknown',
        dayTitle: studyContext.dayTitle || 'Unknown',
        dayTheme: studyContext.dayTheme || 'Unknown',
        primaryScripture: dayContent.metadata?.primaryScripture || 'Not specified',
        audience: studyContext.audience,
        difficulty: studyContext.difficulty,

        // Content sections
        openingPrayer: dayContent.openingPrayer || 'Not provided',
        studyIntroduction: dayContent.studyIntroduction || 'Not provided',
        mainTeaching: dayContent.teachingContent?.mainTeaching || 'Not provided',
        scriptureExplanation: dayContent.teachingContent?.scriptureExplanation || 'Not provided',
        historicalContext: dayContent.teachingContent?.historicalContext || 'Not provided',
        modernApplication: dayContent.teachingContent?.modernApplication || 'Not provided',
        discussionQuestions: JSON.stringify(dayContent.discussionQuestions || []),
        practicalApplication: JSON.stringify(dayContent.practicalApplication || {}),
        closingPrayer: dayContent.closingPrayer || 'Not provided',

        format_instructions: formatInstructions
      });

      // Enhance validation result with additional analysis
      const enhancedResult = this.enhanceValidationResult(result, dayContent, studyContext);

      console.log(`Theological validation complete for Day ${dayContent.metadata?.dayNumber}: ${enhancedResult.overallAssessment.overallRating}`);

      return enhancedResult;

    } catch (error) {
      console.error(`Error in theological validation:`, error);
      throw new Error(`Failed to validate content: ${error.message}`);
    }
  }

  /**
   * Validate multiple days of content
   * @param {Array} daysContent - Array of day contents
   * @param {Object} studyContext - Overall study context
   * @returns {Promise<Array>} Array of validation results
   */
  async validateMultipleDays(daysContent, studyContext) {
    console.log(`Validating theological content for ${daysContent.length} days`);

    const results = [];

    // Process sequentially to ensure thorough validation
    for (const dayContent of daysContent) {
      try {
        const validation = await this.validateDayContent(dayContent, studyContext);
        results.push(validation);

        // Small delay between validations
        await this.delay(500);
      } catch (error) {
        console.error(`Error validating day ${dayContent.metadata?.dayNumber}:`, error);
        results.push(this.createErrorValidation(dayContent, error));
      }
    }

    // Create overall study validation summary
    const studyValidationSummary = this.createStudyValidationSummary(results, studyContext);

    console.log(`Theological validation complete: ${results.length} days validated`);

    return {
      individualDays: results,
      studySummary: studyValidationSummary
    };
  }

  /**
   * Enhance validation result with additional analysis
   * @param {Object} result - Raw validation result
   * @param {Object} dayContent - Original content
   * @param {Object} studyContext - Study context
   * @returns {Object} Enhanced validation result
   */
  enhanceValidationResult(result, dayContent, studyContext) {
    // Add metadata
    result.validationMetadata = {
      validatedAt: new Date().toISOString(),
      validatorVersion: '1.0.0',
      dayNumber: dayContent.metadata?.dayNumber,
      studyTitle: studyContext.title,
      contentWordCount: this.calculateWordCount(dayContent),
      scriptureReferences: this.extractScriptureReferences(dayContent)
    };

    // Calculate overall score
    result.overallAssessment.scoreBreakdown = this.calculateValidationScores(result);

    // Add urgency flags
    result.urgencyFlags = this.identifyUrgencyFlags(result);

    // Add content statistics
    result.contentAnalysis = this.analyzeContentComplexity(dayContent);

    return result;
  }

  /**
   * Create error validation result for failed validations
   * @param {Object} dayContent - Content that failed validation
   * @param {Error} error - Error that occurred
   * @returns {Object} Error validation result
   */
  createErrorValidation(dayContent, error) {
    return {
      overallAssessment: {
        isApproved: false,
        overallRating: 'rejected',
        confidence: 0,
        majorConcerns: ['Validation process failed'],
        recommendedActions: ['Review content manually', 'Retry validation process']
      },
      sectionValidations: [],
      validationError: {
        message: error.message,
        timestamp: new Date().toISOString(),
        dayNumber: dayContent.metadata?.dayNumber
      },
      validationMetadata: {
        validatedAt: new Date().toISOString(),
        validatorVersion: '1.0.0',
        dayNumber: dayContent.metadata?.dayNumber,
        failed: true
      }
    };
  }

  /**
   * Create overall study validation summary
   * @param {Array} dayValidations - Individual day validation results
   * @param {Object} studyContext - Study context
   * @returns {Object} Study validation summary
   */
  createStudyValidationSummary(dayValidations, studyContext) {
    const totalDays = dayValidations.length;
    const approvedDays = dayValidations.filter(v => v.overallAssessment?.isApproved).length;
    const failedDays = dayValidations.filter(v => v.validationError).length;

    // Calculate average ratings
    const ratingCounts = {};
    dayValidations.forEach(v => {
      if (v.overallAssessment?.overallRating) {
        ratingCounts[v.overallAssessment.overallRating] = (ratingCounts[v.overallAssessment.overallRating] || 0) + 1;
      }
    });

    // Collect all major concerns
    const allConcerns = [];
    dayValidations.forEach(v => {
      if (v.overallAssessment?.majorConcerns) {
        allConcerns.push(...v.overallAssessment.majorConcerns);
      }
    });

    const uniqueConcerns = [...new Set(allConcerns)];

    return {
      studyOverview: {
        title: studyContext.title,
        totalDays,
        approvedDays,
        rejectedDays: totalDays - approvedDays,
        failedValidations: failedDays,
        approvalRate: Math.round((approvedDays / totalDays) * 100)
      },
      qualityDistribution: ratingCounts,
      commonConcerns: uniqueConcerns.slice(0, 10), // Top 10 concerns
      recommendedActions: this.generateStudyRecommendations(dayValidations),
      validationSummary: {
        readyForPublication: approvedDays === totalDays && failedDays === 0,
        needsMinorRevisions: approvedDays >= totalDays * 0.8,
        needsMajorRevisions: approvedDays < totalDays * 0.6,
        qualityScore: this.calculateOverallQualityScore(dayValidations)
      },
      validatedAt: new Date().toISOString()
    };
  }

  /**
   * Generate study-level recommendations
   * @param {Array} dayValidations - Individual day validations
   * @returns {Array} Study recommendations
   */
  generateStudyRecommendations(dayValidations) {
    const recommendations = [];

    const rejectedCount = dayValidations.filter(v => v.overallAssessment?.overallRating === 'rejected').length;
    const needsRevisionCount = dayValidations.filter(v => v.overallAssessment?.overallRating === 'needs_revision').length;

    if (rejectedCount > 0) {
      recommendations.push(`Review and revise ${rejectedCount} days with rejected content`);
    }

    if (needsRevisionCount > 0) {
      recommendations.push(`Address concerns in ${needsRevisionCount} days needing revision`);
    }

    if (rejectedCount === 0 && needsRevisionCount === 0) {
      recommendations.push('Study is ready for publication');
    }

    return recommendations;
  }

  /**
   * Calculate validation scores
   * @param {Object} result - Validation result
   * @returns {Object} Score breakdown
   */
  calculateValidationScores(result) {
    const ratingToScore = {
      'excellent': 100,
      'good': 80,
      'acceptable': 60,
      'concerning': 40,
      'problematic': 20,
      'poor': 20
    };

    const scores = {
      scripture: ratingToScore[result.scriptureValidation?.contextualAccuracy] || 0,
      doctrine: result.doctrinalConsistency?.orthodoxTeaching ? 80 : 20,
      application: result.practicalApplication?.realistic ? 80 : 20,
      overall: ratingToScore[result.overallAssessment?.overallRating] || 0
    };

    scores.average = Math.round((scores.scripture + scores.doctrine + scores.application + scores.overall) / 4);

    return scores;
  }

  /**
   * Identify urgency flags for quick attention
   * @param {Object} result - Validation result
   * @returns {Array} Urgency flags
   */
  identifyUrgencyFlags(result) {
    const flags = [];

    if (result.overallAssessment?.overallRating === 'rejected') {
      flags.push('REJECTED_CONTENT');
    }

    if (result.doctrinalConsistency?.orthodoxTeaching === false) {
      flags.push('DOCTRINAL_ERROR');
    }

    if (result.scriptureValidation?.hermeneuticalSoundness === 'poor') {
      flags.push('POOR_INTERPRETATION');
    }

    if (result.overallAssessment?.majorConcerns?.length > 3) {
      flags.push('MULTIPLE_CONCERNS');
    }

    return flags;
  }

  /**
   * Analyze content complexity
   * @param {Object} dayContent - Day content
   * @returns {Object} Content analysis
   */
  analyzeContentComplexity(dayContent) {
    return {
      wordCount: this.calculateWordCount(dayContent),
      questionCount: dayContent.discussionQuestions?.length || 0,
      scriptureCount: this.extractScriptureReferences(dayContent).length,
      complexityLevel: this.assessComplexityLevel(dayContent)
    };
  }

  /**
   * Calculate word count of content
   * @param {Object} content - Content object
   * @returns {number} Word count
   */
  calculateWordCount(content) {
    const textContent = JSON.stringify(content);
    return textContent.split(/\\s+/).length;
  }

  /**
   * Extract scripture references from content
   * @param {Object} dayContent - Day content
   * @returns {Array} Scripture references
   */
  extractScriptureReferences(dayContent) {
    const references = [];

    if (dayContent.metadata?.primaryScripture) {
      references.push(dayContent.metadata.primaryScripture);
    }

    if (dayContent.metadata?.supportingScriptures) {
      references.push(...dayContent.metadata.supportingScriptures);
    }

    if (dayContent.additionalResources?.relatedScriptures) {
      references.push(...dayContent.additionalResources.relatedScriptures);
    }

    return [...new Set(references)]; // Remove duplicates
  }

  /**
   * Assess complexity level of content
   * @param {Object} dayContent - Day content
   * @returns {string} Complexity level
   */
  assessComplexityLevel(dayContent) {
    const wordCount = this.calculateWordCount(dayContent);
    const questionCount = dayContent.discussionQuestions?.length || 0;

    if (wordCount > 2000 && questionCount > 6) return 'high';
    if (wordCount > 1000 && questionCount > 4) return 'medium';
    return 'low';
  }

  /**
   * Calculate overall quality score for the study
   * @param {Array} dayValidations - Day validation results
   * @returns {number} Quality score (0-100)
   */
  calculateOverallQualityScore(dayValidations) {
    if (dayValidations.length === 0) return 0;

    const scores = dayValidations.map(v => {
      if (v.overallAssessment?.scoreBreakdown?.average) {
        return v.overallAssessment.scoreBreakdown.average;
      }
      return 0;
    });

    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  /**
   * Utility function for delays
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Create and return a new Theological Validator instance
 * @returns {TheologicalValidator} New validator instance
 */
function createTheologicalValidator() {
  return new TheologicalValidator();
}

module.exports = {
  TheologicalValidator,
  createTheologicalValidator
};