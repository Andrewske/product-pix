/**
 * Prompt Bench - Prompt Testing Framework
 *
 * CLI-driven system for iterating on AI prompt templates.
 * External API for any consumers in the main application.
 */

// ============================================================================
// Types
// ============================================================================
export * from './core/types';
export * from './core/errors';

// ============================================================================
// Core Functionality
// ============================================================================
export {
  compileTemplate,
  generateIdempotencyKey,
  applyDefaults,
  substituteVariables,
  assemblePrompt,
} from './core/compiler';

export {
  evaluateImage,
  evaluateBatch,
} from './core/evaluator';

export {
  summarize,
  welchTTest,
  getScoreDistribution,
  formatReport,
} from './core/statistics';

export {
  resolveSourceImage,
  getMimeType,
  computeHash,
} from './core/source-image';

export {
  runPipeline,
  generateBatchLabel,
} from './core/orchestrator';

// ============================================================================
// Templates
// ============================================================================
export {
  getRegisteredTemplate,
  getRegisteredSlugs,
  TEMPLATE_REGISTRY,
} from './templates/registry';

export { ECOMMERCE_BASE } from './templates/ecommerce-base';
export { LIFESTYLE_PRODUCT } from './templates/lifestyle-product';

// ============================================================================
// Database Operations
// ============================================================================
export {
  fetchTemplate,
  syncTemplate,
  syncAllTemplates,
  updateTemplateStatus,
} from './db/templates';