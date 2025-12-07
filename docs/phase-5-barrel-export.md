# Phase 5: Create Barrel Export

## Overview
Create `prompt-bench/index.ts` as a barrel export file for any external consumers of the prompt-bench framework.

## Tasks

### 5.1 Create prompt-bench/index.ts

**File**: `/home/kevin/coding/product-pix/prompt-bench/index.ts`

```typescript
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
  formatBatchReport,
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

export { ecommerceBase } from './templates/ecommerce-base';
export { lifestyleProduct } from './templates/lifestyle-product';

// ============================================================================
// Database Operations
// ============================================================================
export {
  fetchTemplate,
  syncTemplate,
  syncAllTemplates,
  updateTemplateStatus,
  parseTemplateRow,
} from './db/templates';
```

### 5.2 Create Core Index (Optional)

If you want cleaner imports within the framework, create `prompt-bench/core/index.ts`:

**File**: `/home/kevin/coding/product-pix/prompt-bench/core/index.ts`

```typescript
/**
 * Core framework modules
 */
export * from './types';
export * from './errors';
export * from './compiler';
export * from './evaluator';
export * from './statistics';
export * from './source-image';
export * from './orchestrator';
```

This allows:
```typescript
// Instead of
import { BatchFileSchema } from '@bench/core/types';
import { compileTemplate } from '@bench/core/compiler';

// You can use
import { BatchFileSchema, compileTemplate } from '@bench/core';
```

## Verification
```bash
# Check that the barrel file exports correctly
bun run tsc --noEmit

# Test imports work
echo "import { compileTemplate, BatchFileSchema } from './prompt-bench';" > /tmp/test-import.ts
bun run tsc --noEmit /tmp/test-import.ts
```

## Dependencies
- Phase 4 (Update Imports) must be complete

## Next Phase
Phase 6: Cleanup
