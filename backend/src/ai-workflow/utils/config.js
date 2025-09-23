const { ChatOpenAI } = require('@langchain/openai');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the backend root .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * AI Workflow Configuration
 */
const AI_CONFIG = {
  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4',
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 2000,
  },

  // Workflow Configuration
  workflow: {
    enabled: process.env.AI_WORKFLOW_ENABLED === 'true',
    maxConcurrentGenerations: parseInt(process.env.MAX_CONCURRENT_GENERATIONS) || 3,
    contentGenerationTimeout: parseInt(process.env.CONTENT_GENERATION_TIMEOUT) || 300000, // 5 minutes
    bibleApiCacheTtl: parseInt(process.env.BIBLE_API_CACHE_TTL) || 86400, // 24 hours
  },

  // Agent-specific configurations
  agents: {
    requestParser: {
      model: process.env.OPENAI_MODEL || 'gpt-4',
      temperature: 0.3,
      maxTokens: 1000,
      timeout: 30000,
    },
    studyPlanner: {
      model: process.env.OPENAI_MODEL || 'gpt-4',
      temperature: 0.5,
      maxTokens: 2000,
      timeout: 60000,
    },
    contentGenerator: {
      model: process.env.OPENAI_MODEL || 'gpt-4',
      temperature: 0.7,
      maxTokens: 3000,
      timeout: 120000,
    },
    theologicalValidator: {
      model: process.env.OPENAI_MODEL || 'gpt-4',
      temperature: 0.2,
      maxTokens: 1500,
      timeout: 60000,
    },
  },
};

/**
 * Validates the AI configuration
 * @returns {Object} Validation result with isValid boolean and errors array
 */
function validateAIConfig() {
  const errors = [];

  // Check OpenAI API key
  if (!AI_CONFIG.openai.apiKey) {
    errors.push('OPENAI_API_KEY is required but not set in environment variables');
  }

  // Check model availability
  const supportedModels = ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'];
  if (!supportedModels.includes(AI_CONFIG.openai.model)) {
    errors.push(`Unsupported OpenAI model: ${AI_CONFIG.openai.model}. Supported models: ${supportedModels.join(', ')}`);
  }

  // Check temperature range
  if (AI_CONFIG.openai.temperature < 0 || AI_CONFIG.openai.temperature > 2) {
    errors.push('OpenAI temperature must be between 0 and 2');
  }

  // Check max tokens
  if (AI_CONFIG.openai.maxTokens < 100 || AI_CONFIG.openai.maxTokens > 8000) {
    errors.push('OpenAI max tokens must be between 100 and 8000');
  }

  // Check workflow configuration
  if (AI_CONFIG.workflow.maxConcurrentGenerations < 1 || AI_CONFIG.workflow.maxConcurrentGenerations > 10) {
    errors.push('Max concurrent generations must be between 1 and 10');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Creates an OpenAI client instance for a specific agent
 * @param {string} agentType - Type of agent (requestParser, studyPlanner, etc.)
 * @returns {ChatOpenAI} OpenAI client instance
 */
function createOpenAIClient(agentType = 'default') {
  const agentConfig = AI_CONFIG.agents[agentType] || AI_CONFIG.openai;

  return new ChatOpenAI({
    openAIApiKey: AI_CONFIG.openai.apiKey,
    modelName: agentConfig.model,
    temperature: agentConfig.temperature,
    maxTokens: agentConfig.maxTokens,
    timeout: agentConfig.timeout,
  });
}

/**
 * Gets the configuration for a specific agent
 * @param {string} agentType - Type of agent
 * @returns {Object} Agent configuration
 */
function getAgentConfig(agentType) {
  return AI_CONFIG.agents[agentType] || AI_CONFIG.agents.contentGenerator;
}

/**
 * Checks if AI workflow is enabled and properly configured
 * @returns {boolean} True if enabled and configured
 */
function isAIWorkflowEnabled() {
  const validation = validateAIConfig();
  return AI_CONFIG.workflow.enabled && validation.isValid;
}

/**
 * Gets the database connection pool (to be imported from your existing db config)
 * This will need to be updated to import your actual database connection
 */
function getDbPool() {
  // TODO: Import your actual database connection pool
  // This is a placeholder that should be replaced with your actual implementation
  throw new Error('Database pool not implemented. Please import your actual database connection.');
}

/**
 * Logs AI workflow configuration status
 */
function logAIConfig() {
  const validation = validateAIConfig();

  console.log('AI Workflow Configuration:');
  console.log(`  Enabled: ${AI_CONFIG.workflow.enabled}`);
  console.log(`  OpenAI Model: ${AI_CONFIG.openai.model}`);
  console.log(`  Max Concurrent Generations: ${AI_CONFIG.workflow.maxConcurrentGenerations}`);
  console.log(`  Configuration Valid: ${validation.isValid}`);

  if (!validation.isValid) {
    console.error('AI Configuration Errors:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
  }
}

module.exports = {
  AI_CONFIG,
  validateAIConfig,
  createOpenAIClient,
  getAgentConfig,
  isAIWorkflowEnabled,
  getDbPool,
  logAIConfig
};