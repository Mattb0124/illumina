/**
 * Workflow and Status Constants
 *
 * Constants for AI study generation workflow status tracking and database operations.
 */

/**
 * Workflow step constants
 */
const WORKFLOW_STEPS = {
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
const GENERATION_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  CONTENT_GENERATION: 'content_generation',
  VALIDATION: 'validation',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

const STEP_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  SKIPPED: 'skipped'
};

const VALIDATION_STATUS = {
  PENDING: 'pending',
  VALIDATING: 'validating',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  NEEDS_REVIEW: 'needs_review'
};

module.exports = {
  WORKFLOW_STEPS,
  GENERATION_STATUS,
  STEP_STATUS,
  VALIDATION_STATUS
};