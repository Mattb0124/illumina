/**
 * @typedef {Object} StudyGenerationRequest
 * @property {string} id - Unique identifier for the request
 * @property {string} userId - ID of the user making the request
 * @property {string} title - Title of the study
 * @property {string} topic - Main topic/theme of the study
 * @property {string} duration - Duration description (e.g., "8 weeks", "30 days")
 * @property {number} durationDays - Duration in days
 * @property {'devotional'|'topical'|'book-study'|'couples'|'marriage'} studyStyle - Type of study
 * @property {'beginner'|'intermediate'|'advanced'} difficulty - Difficulty level
 * @property {'individual'|'couples'|'group'|'family'} audience - Target audience
 * @property {string} [specialRequirements] - Additional requirements or preferences
 * @property {Object} requestDetails - Full request details in JSON format
 * @property {'pending'|'processing'|'content_generation'|'validation'|'completed'|'failed'|'cancelled'} status - Current status
 * @property {number} progressPercentage - Progress percentage (0-100)
 * @property {string} [errorMessage] - Error message if failed
 * @property {Date} [completionDate] - Date when completed
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} GeneratedStudyContent
 * @property {string} id - Unique identifier
 * @property {string} requestId - Reference to the generation request
 * @property {number} dayNumber - Day number in the study
 * @property {number} [weekNumber] - Week number if applicable
 * @property {string} title - Title of this day's study
 * @property {string} [theme] - Theme for this day
 * @property {string} [openingPrayer] - Opening prayer text
 * @property {string} [studyFocus] - Main focus of the study
 * @property {string} [teachingContent] - Teaching content
 * @property {Array<Object>} biblePassages - Bible passages with references
 * @property {Array<string>} discussionQuestions - Discussion questions
 * @property {string} [reflectionQuestion] - Reflection question
 * @property {Array<string>} applicationPoints - Application points
 * @property {string} [prayerFocus] - Prayer focus
 * @property {string} [estimatedTime] - Estimated time for completion
 * @property {Object} contentData - Full content data in JSON format
 * @property {'pending'|'generating'|'validating'|'completed'|'failed'} generationStatus - Generation status
 * @property {'pending'|'validating'|'approved'|'rejected'|'needs_review'} validationStatus - Validation status
 * @property {string} [validationNotes] - Validation notes
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} WorkflowState
 * @property {string} id - Unique identifier
 * @property {string} requestId - Reference to the generation request
 * @property {string} currentStep - Current workflow step
 * @property {'pending'|'in_progress'|'completed'|'failed'|'skipped'} stepStatus - Status of current step
 * @property {Object} stepData - Step-specific data
 * @property {Object} [errorDetails] - Error details if failed
 * @property {number} retryCount - Number of retries attempted
 * @property {Date} [startedAt] - When step started
 * @property {Date} [completedAt] - When step completed
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} updatedAt - Last update timestamp
 */

/**
 * @typedef {Object} BibleVerseValidation
 * @property {string} id - Unique identifier
 * @property {string} reference - Original verse reference
 * @property {string} normalizedReference - Normalized reference format
 * @property {'valid'|'invalid'|'not_found'|'api_error'} validationStatus - Validation result
 * @property {Object} [apiResponse] - Full API response
 * @property {string} [verseText] - The actual verse text
 * @property {string} translation - Bible translation used
 * @property {string} [errorMessage] - Error message if validation failed
 * @property {Date} lastValidatedAt - Last validation timestamp
 * @property {Date} [cacheExpiresAt] - When cache expires
 * @property {Date} createdAt - Creation timestamp
 */

/**
 * @typedef {Object} AgentConfig
 * @property {string} model - OpenAI model to use
 * @property {number} temperature - Temperature setting
 * @property {number} maxTokens - Maximum tokens
 * @property {number} timeout - Timeout in milliseconds
 */

/**
 * @typedef {Object} WorkflowConfig
 * @property {boolean} enabled - Whether AI workflow is enabled
 * @property {number} maxConcurrentGenerations - Max concurrent generations
 * @property {number} contentGenerationTimeout - Timeout for content generation
 * @property {number} bibleApiCacheTtl - Bible API cache TTL in seconds
 * @property {AgentConfig} agents - Agent configurations
 */

/**
 * Workflow step constants
 */
export const WORKFLOW_STEPS = {
  PARSE_REQUEST: 'parse_request',
  PLAN_STUDY: 'plan_study',
  GENERATE_CONTENT: 'generate_content',
  VALIDATE_VERSES: 'validate_verses',
  THEOLOGICAL_VALIDATION: 'theological_validation',
  ASSEMBLY: 'assembly',
  COMPLETED: 'completed'
};

/**
 * Status constants
 */
export const GENERATION_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  CONTENT_GENERATION: 'content_generation',
  VALIDATION: 'validation',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

export const STEP_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  SKIPPED: 'skipped'
};

export const VALIDATION_STATUS = {
  PENDING: 'pending',
  VALIDATING: 'validating',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  NEEDS_REVIEW: 'needs_review'
};