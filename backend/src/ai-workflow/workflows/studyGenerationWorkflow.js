const { StateGraph, MessagesAnnotation } = require('@langchain/langgraph');
const { query } = require('../../config/database');
const { createStudyRequestParser } = require('../agents/requestParser');
const { createStudyPlanner } = require('../agents/studyPlanner');
const { createContentGenerator } = require('../agents/contentGenerator');
const { createTheologicalValidator } = require('../agents/theologicalValidator');
const { createBibleVerseValidator } = require('../tools/bibleVerseValidator');
const { WORKFLOW_STEPS, GENERATION_STATUS, STEP_STATUS } = require('../types/index');

/**
 * Study Generation Workflow
 *
 * This is the main LangGraph workflow that orchestrates the entire
 * Bible study generation process from user request to final validated content.
 */

// Define the workflow state structure
const WorkflowState = {
  // Request information
  requestId: null,
  userId: null,
  userRequest: null,

  // Parsed request data
  parsedRequest: null,

  // Study plan
  studyPlan: null,

  // Generated content
  generatedContent: [],

  // Validation results
  verseValidations: [],
  theologicalValidations: [],

  // Workflow status
  currentStep: WORKFLOW_STEPS.PARSE_REQUEST,
  status: GENERATION_STATUS.PENDING,
  progress: 0,
  errors: [],

  // Metadata
  startTime: null,
  endTime: null,
  duration: null
};

/**
 * Bible Study Generation Workflow Class
 */
class StudyGenerationWorkflow {
  constructor() {
    this.requestParser = createStudyRequestParser();
    this.studyPlanner = createStudyPlanner();
    this.contentGenerator = createContentGenerator();
    this.theologicalValidator = createTheologicalValidator();
    this.bibleVerseValidator = createBibleVerseValidator();

    // Initialize the workflow graph
    this.workflow = this.buildWorkflow();
  }

  /**
   * Build the LangGraph workflow
   * @returns {StateGraph} Compiled workflow
   */
  buildWorkflow() {
    const workflow = new StateGraph(WorkflowState);

    // Add workflow nodes
    workflow.addNode('parseRequest', this.parseRequestNode.bind(this));
    workflow.addNode('planStudy', this.planStudyNode.bind(this));
    workflow.addNode('generateContent', this.generateContentNode.bind(this));
    workflow.addNode('validateVerses', this.validateVersesNode.bind(this));
    workflow.addNode('validateTheology', this.validateTheologyNode.bind(this));
    workflow.addNode('finalizeStudy', this.finalizeStudyNode.bind(this));
    workflow.addNode('handleError', this.handleErrorNode.bind(this));

    // Define the workflow edges
    workflow.addEdge('__start__', 'parseRequest');
    workflow.addConditionalEdges(
      'parseRequest',
      this.shouldContinueAfterParsing.bind(this),
      {
        continue: 'planStudy',
        error: 'handleError'
      }
    );
    workflow.addConditionalEdges(
      'planStudy',
      this.shouldContinueAfterPlanning.bind(this),
      {
        continue: 'generateContent',
        error: 'handleError'
      }
    );
    workflow.addConditionalEdges(
      'generateContent',
      this.shouldContinueAfterGeneration.bind(this),
      {
        continue: 'validateVerses',
        error: 'handleError'
      }
    );
    workflow.addConditionalEdges(
      'validateVerses',
      this.shouldContinueAfterVerseValidation.bind(this),
      {
        continue: 'validateTheology',
        error: 'handleError'
      }
    );
    workflow.addConditionalEdges(
      'validateTheology',
      this.shouldContinueAfterTheologyValidation.bind(this),
      {
        continue: 'finalizeStudy',
        error: 'handleError'
      }
    );
    workflow.addEdge('finalizeStudy', '__end__');
    workflow.addEdge('handleError', '__end__');

    return workflow.compile();
  }

  /**
   * Execute the complete study generation workflow
   * @param {Object} initialRequest - Initial user request
   * @returns {Promise<Object>} Final workflow result
   */
  async generateStudy(initialRequest) {
    console.log('Starting Bible study generation workflow');

    // Initialize state
    const initialState = {
      ...WorkflowState,
      requestId: initialRequest.requestId,
      userId: initialRequest.userId,
      userRequest: initialRequest.userRequest,
      startTime: new Date(),
      status: GENERATION_STATUS.PROCESSING
    };

    try {
      // Update database with initial status
      await this.updateRequestStatus(initialRequest.requestId, GENERATION_STATUS.PROCESSING, 0);

      // Execute the workflow
      const result = await this.workflow.invoke(initialState);

      console.log('Workflow completed:', result.status);
      return result;

    } catch (error) {
      console.error('Workflow execution failed:', error);

      // Update database with error status
      await this.updateRequestStatus(
        initialRequest.requestId,
        GENERATION_STATUS.FAILED,
        0,
        error.message
      );

      throw error;
    }
  }

  /**
   * Parse Request Node - Extract structured information from user request
   */
  async parseRequestNode(state) {
    console.log('Executing parseRequest node');

    try {
      await this.updateWorkflowStep(state.requestId, WORKFLOW_STEPS.PARSE_REQUEST, STEP_STATUS.IN_PROGRESS);

      const parsedRequest = await this.requestParser.parseRequest(state.userRequest);

      // Validate the parsed request
      const validation = this.requestParser.validateParsedRequest(parsedRequest);
      if (!validation.isValid) {
        throw new Error(`Request parsing validation failed: ${validation.errors.join(', ')}`);
      }

      await this.updateWorkflowStep(state.requestId, WORKFLOW_STEPS.PARSE_REQUEST, STEP_STATUS.COMPLETED);
      await this.updateRequestStatus(state.requestId, GENERATION_STATUS.PROCESSING, 10);

      return {
        ...state,
        parsedRequest,
        currentStep: WORKFLOW_STEPS.PLAN_STUDY,
        progress: 10
      };

    } catch (error) {
      console.error('Error in parseRequest node:', error);
      await this.updateWorkflowStep(state.requestId, WORKFLOW_STEPS.PARSE_REQUEST, STEP_STATUS.FAILED, { error: error.message });

      return {
        ...state,
        errors: [...state.errors, error.message],
        status: GENERATION_STATUS.FAILED
      };
    }
  }

  /**
   * Plan Study Node - Create high-level study plan
   */
  async planStudyNode(state) {
    console.log('Executing planStudy node');

    try {
      await this.updateWorkflowStep(state.requestId, WORKFLOW_STEPS.PLAN_STUDY, STEP_STATUS.IN_PROGRESS);

      const studyPlan = await this.studyPlanner.createStudyPlan(state.parsedRequest);

      // Validate the study plan
      const validation = this.studyPlanner.validateStudyPlan(studyPlan);
      if (!validation.isValid) {
        throw new Error(`Study plan validation failed: ${validation.errors.join(', ')}`);
      }

      await this.updateWorkflowStep(state.requestId, WORKFLOW_STEPS.PLAN_STUDY, STEP_STATUS.COMPLETED);
      await this.updateRequestStatus(state.requestId, GENERATION_STATUS.CONTENT_GENERATION, 25);

      return {
        ...state,
        studyPlan,
        currentStep: WORKFLOW_STEPS.GENERATE_CONTENT,
        progress: 25
      };

    } catch (error) {
      console.error('Error in planStudy node:', error);
      await this.updateWorkflowStep(state.requestId, WORKFLOW_STEPS.PLAN_STUDY, STEP_STATUS.FAILED, { error: error.message });

      return {
        ...state,
        errors: [...state.errors, error.message],
        status: GENERATION_STATUS.FAILED
      };
    }
  }

  /**
   * Generate Content Node - Generate detailed content for each day
   */
  async generateContentNode(state) {
    console.log('Executing generateContent node');

    try {
      await this.updateWorkflowStep(state.requestId, WORKFLOW_STEPS.GENERATE_CONTENT, STEP_STATUS.IN_PROGRESS);

      // Prepare study context for content generation
      const studyContext = {
        title: state.studyPlan.studyOverview.title,
        topic: state.parsedRequest.topic,
        studyStyle: state.parsedRequest.studyStyle,
        difficulty: state.parsedRequest.difficulty,
        audience: state.parsedRequest.audience,
        description: state.studyPlan.studyOverview.description
      };

      // Generate content for all days
      const concurrency = parseInt(process.env.MAX_CONCURRENT_GENERATIONS) || 3;
      const generatedContent = await this.contentGenerator.generateMultipleDaysContent(
        state.studyPlan.dailyPlans,
        studyContext,
        concurrency
      );

      // Store generated content in database
      await this.storeGeneratedContent(state.requestId, generatedContent);

      await this.updateWorkflowStep(state.requestId, WORKFLOW_STEPS.GENERATE_CONTENT, STEP_STATUS.COMPLETED);
      await this.updateRequestStatus(state.requestId, GENERATION_STATUS.VALIDATION, 60);

      return {
        ...state,
        generatedContent,
        currentStep: WORKFLOW_STEPS.VALIDATE_VERSES,
        progress: 60
      };

    } catch (error) {
      console.error('Error in generateContent node:', error);
      await this.updateWorkflowStep(state.requestId, WORKFLOW_STEPS.GENERATE_CONTENT, STEP_STATUS.FAILED, { error: error.message });

      return {
        ...state,
        errors: [...state.errors, error.message],
        status: GENERATION_STATUS.FAILED
      };
    }
  }

  /**
   * Validate Verses Node - Validate all Bible verse references
   */
  async validateVersesNode(state) {
    console.log('Executing validateVerses node');

    try {
      await this.updateWorkflowStep(state.requestId, WORKFLOW_STEPS.VALIDATE_VERSES, STEP_STATUS.IN_PROGRESS);

      // Extract all Bible references from the study plan and generated content
      const allReferences = this.bibleVerseValidator.extractReferencesFromStudyPlan(state.studyPlan);

      // Add references from generated content
      state.generatedContent.forEach(dayContent => {
        if (dayContent.metadata?.supportingScriptures) {
          allReferences.push(...dayContent.metadata.supportingScriptures);
        }
      });

      // Remove duplicates
      const uniqueReferences = [...new Set(allReferences)];

      // Validate all references
      const verseValidations = await this.bibleVerseValidator.validateReferences(uniqueReferences);

      // Check if critical verses failed validation
      const failedValidations = verseValidations.filter(v => !v.isValid);
      if (failedValidations.length > uniqueReferences.length * 0.2) { // More than 20% failed
        console.warn(`High validation failure rate: ${failedValidations.length}/${uniqueReferences.length} verses failed`);
      }

      await this.updateWorkflowStep(state.requestId, WORKFLOW_STEPS.VALIDATE_VERSES, STEP_STATUS.COMPLETED);
      await this.updateRequestStatus(state.requestId, GENERATION_STATUS.VALIDATION, 75);

      return {
        ...state,
        verseValidations,
        currentStep: WORKFLOW_STEPS.THEOLOGICAL_VALIDATION,
        progress: 75
      };

    } catch (error) {
      console.error('Error in validateVerses node:', error);
      await this.updateWorkflowStep(state.requestId, WORKFLOW_STEPS.VALIDATE_VERSES, STEP_STATUS.FAILED, { error: error.message });

      return {
        ...state,
        errors: [...state.errors, error.message],
        status: GENERATION_STATUS.FAILED
      };
    }
  }

  /**
   * Validate Theology Node - Validate theological accuracy of content
   */
  async validateTheologyNode(state) {
    console.log('Executing validateTheology node');

    try {
      await this.updateWorkflowStep(state.requestId, WORKFLOW_STEPS.THEOLOGICAL_VALIDATION, STEP_STATUS.IN_PROGRESS);

      // Prepare study context
      const studyContext = {
        title: state.studyPlan.studyOverview.title,
        topic: state.parsedRequest.topic,
        audience: state.parsedRequest.audience,
        difficulty: state.parsedRequest.difficulty
      };

      // Validate theological content for each day
      const theologicalValidations = await this.theologicalValidator.validateMultipleDays(
        state.generatedContent,
        studyContext
      );

      // Check overall approval status
      const approvedDays = theologicalValidations.individualDays.filter(
        v => v.overallAssessment?.isApproved
      ).length;

      const approvalRate = approvedDays / theologicalValidations.individualDays.length;

      if (approvalRate < 0.8) { // Less than 80% approved
        console.warn(`Low theological approval rate: ${approvedDays}/${theologicalValidations.individualDays.length} days approved`);
      }

      await this.updateWorkflowStep(state.requestId, WORKFLOW_STEPS.THEOLOGICAL_VALIDATION, STEP_STATUS.COMPLETED);
      await this.updateRequestStatus(state.requestId, GENERATION_STATUS.VALIDATION, 90);

      return {
        ...state,
        theologicalValidations,
        currentStep: WORKFLOW_STEPS.ASSEMBLY,
        progress: 90
      };

    } catch (error) {
      console.error('Error in validateTheology node:', error);
      await this.updateWorkflowStep(state.requestId, WORKFLOW_STEPS.THEOLOGICAL_VALIDATION, STEP_STATUS.FAILED, { error: error.message });

      return {
        ...state,
        errors: [...state.errors, error.message],
        status: GENERATION_STATUS.FAILED
      };
    }
  }

  /**
   * Finalize Study Node - Complete the study generation process
   */
  async finalizeStudyNode(state) {
    console.log('Executing finalizeStudy node');

    try {
      await this.updateWorkflowStep(state.requestId, WORKFLOW_STEPS.ASSEMBLY, STEP_STATUS.IN_PROGRESS);

      // Calculate final approval status
      const isApproved = this.calculateFinalApprovalStatus(state);

      // Update the study generation request with final status
      const finalStatus = isApproved ? GENERATION_STATUS.COMPLETED : GENERATION_STATUS.FAILED;

      // Create the final study if approved
      if (isApproved) {
        await this.createFinalStudy(state);
      }

      // Update completion information
      const endTime = new Date();
      const duration = endTime.getTime() - state.startTime.getTime();

      await this.updateWorkflowStep(state.requestId, WORKFLOW_STEPS.COMPLETED, STEP_STATUS.COMPLETED);
      await this.updateRequestStatus(state.requestId, finalStatus, 100, null, endTime);

      console.log(`Study generation workflow completed: ${finalStatus}`);

      return {
        ...state,
        currentStep: WORKFLOW_STEPS.COMPLETED,
        status: finalStatus,
        progress: 100,
        endTime,
        duration
      };

    } catch (error) {
      console.error('Error in finalizeStudy node:', error);
      await this.updateWorkflowStep(state.requestId, WORKFLOW_STEPS.ASSEMBLY, STEP_STATUS.FAILED, { error: error.message });

      return {
        ...state,
        errors: [...state.errors, error.message],
        status: GENERATION_STATUS.FAILED
      };
    }
  }

  /**
   * Handle Error Node - Handle any workflow errors
   */
  async handleErrorNode(state) {
    console.log('Executing handleError node');

    try {
      await this.updateRequestStatus(
        state.requestId,
        GENERATION_STATUS.FAILED,
        state.progress,
        state.errors.join('; ')
      );

      return {
        ...state,
        status: GENERATION_STATUS.FAILED,
        endTime: new Date()
      };

    } catch (error) {
      console.error('Error in handleError node:', error);
      return state;
    }
  }

  // Conditional edge functions
  shouldContinueAfterParsing(state) {
    return state.parsedRequest && !state.errors.length ? 'continue' : 'error';
  }

  shouldContinueAfterPlanning(state) {
    return state.studyPlan && !state.errors.length ? 'continue' : 'error';
  }

  shouldContinueAfterGeneration(state) {
    return state.generatedContent.length > 0 && !state.errors.length ? 'continue' : 'error';
  }

  shouldContinueAfterVerseValidation(state) {
    return state.verseValidations && !state.errors.length ? 'continue' : 'error';
  }

  shouldContinueAfterTheologyValidation(state) {
    return state.theologicalValidations && !state.errors.length ? 'continue' : 'error';
  }

  // Database interaction methods
  async updateRequestStatus(requestId, status, progress, errorMessage = null, completionDate = null) {
    try {
      await query(
        `UPDATE study_generation_requests
         SET status = $1, progress_percentage = $2, error_message = $3,
             completion_date = $4, updated_at = NOW()
         WHERE id = $5`,
        [status, progress, errorMessage, completionDate, requestId]
      );
    } catch (error) {
      console.error('Error updating request status:', error);
    }
  }

  async updateWorkflowStep(requestId, step, status, data = {}) {
    try {
      await query(
        `INSERT INTO workflow_state
         (request_id, current_step, step_status, step_data, started_at, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6)
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
          status === STEP_STATUS.IN_PROGRESS ? new Date() : null,
          status === STEP_STATUS.COMPLETED || status === STEP_STATUS.FAILED ? new Date() : null
        ]
      );
    } catch (error) {
      console.error('Error updating workflow step:', error);
    }
  }

  async storeGeneratedContent(requestId, generatedContent) {
    try {
      for (const dayContent of generatedContent) {
        if (!dayContent.error) {
          await query(
            `INSERT INTO generated_study_content
             (request_id, day_number, week_number, title, theme, opening_prayer,
              study_focus, teaching_content, bible_passages, discussion_questions,
              reflection_question, application_points, prayer_focus, estimated_time,
              content_data, generation_status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
            [
              requestId,
              dayContent.metadata?.dayNumber,
              dayContent.metadata?.weekNumber,
              dayContent.studyIntroduction?.substring(0, 255) || 'Generated Study Day',
              dayContent.teachingContent?.mainTeaching?.substring(0, 255) || 'Study Theme',
              dayContent.openingPrayer,
              dayContent.studyIntroduction,
              dayContent.teachingContent?.mainTeaching,
              JSON.stringify(dayContent.metadata?.supportingScriptures || []),
              JSON.stringify(dayContent.discussionQuestions || []),
              dayContent.reflectionPrompts?.personalReflection,
              JSON.stringify(dayContent.practicalApplication?.applicationSteps || []),
              dayContent.closingPrayer,
              dayContent.metadata?.estimatedTime,
              JSON.stringify(dayContent),
              'completed'
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error storing generated content:', error);
      throw error;
    }
  }

  calculateFinalApprovalStatus(state) {
    // Check if theological validation passed
    if (!state.theologicalValidations?.studySummary?.validationSummary?.readyForPublication) {
      return false;
    }

    // Check verse validation success rate
    const verseSuccessRate = state.verseValidations.filter(v => v.isValid).length / state.verseValidations.length;
    if (verseSuccessRate < 0.8) {
      return false;
    }

    return true;
  }

  async createFinalStudy(state) {
    // This would create the final study entry in the main studies table
    // For now, we'll just log that it's ready
    console.log('Final study ready for publication:', state.studyPlan.studyOverview.title);
  }
}

/**
 * Create and return a new Study Generation Workflow instance
 * @returns {StudyGenerationWorkflow} New workflow instance
 */
function createStudyGenerationWorkflow() {
  return new StudyGenerationWorkflow();
}

module.exports = {
  StudyGenerationWorkflow,
  createStudyGenerationWorkflow
};