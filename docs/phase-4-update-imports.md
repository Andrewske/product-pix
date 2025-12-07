# Phase 4: Update Import Statements

## Overview
Update all import statements in the moved files to use the new `@bench/*` path alias for internal imports while keeping `@/*` imports for shared infrastructure.

## Import Strategy

### Internal Imports (CHANGE)
All imports within prompt-bench should use `@bench/*`:

```typescript
// Before (relative)
import { BatchFileSchema } from './types';
import { compileTemplate } from '../compiler';

// Before (@/lib/prompts)
import { BatchFileSchema } from '@/lib/prompts/types';
import { Result } from '@/lib/prompts/errors';

// After
import { BatchFileSchema } from '@bench/core/types';
import { Result } from '@bench/core/errors';
```

### External Imports (KEEP UNCHANGED)
Imports from `src/lib/` stay the same:

```typescript
// These remain unchanged
import { createGeminiProvider } from '@/lib/ai/providers/gemini';
import { uploadBuffer, getPublicUrl } from '@/lib/r2';
import { createAdminClient } from '@/lib/supabase/admin';
```

## Tasks

### 4.1 Update Core Module Imports

#### `prompt-bench/core/types.ts`
- Likely no changes needed (uses only zod)

#### `prompt-bench/core/errors.ts`
- Update imports from `./types` to `@bench/core/types`

#### `prompt-bench/core/compiler.ts`
Update:
```typescript
// Before
import { ... } from './types';
import { ... } from './errors';

// After
import { ... } from '@bench/core/types';
import { ... } from '@bench/core/errors';
```

#### `prompt-bench/core/evaluator.ts`
Update:
```typescript
// Before
import { ... } from './types';
import { ... } from './errors';

// After
import { ... } from '@bench/core/types';
import { ... } from '@bench/core/errors';
```

#### `prompt-bench/core/statistics.ts`
Update:
```typescript
// Before
import { ... } from './types';

// After
import { ... } from '@bench/core/types';
```

#### `prompt-bench/core/source-image.ts`
Update:
```typescript
// Before
import { ... } from './types';
import { ... } from './errors';

// After
import { ... } from '@bench/core/types';
import { ... } from '@bench/core/errors';
// Keep: import { uploadBuffer, getPublicUrl } from '@/lib/r2';
```

#### `prompt-bench/core/orchestrator.ts`
Update:
```typescript
// Before
import { ... } from './types';
import { ... } from './errors';
import { compileTemplate } from './compiler';
import { evaluateBatch } from './evaluator';
import { resolveSourceImage } from './source-image';

// After
import { ... } from '@bench/core/types';
import { ... } from '@bench/core/errors';
import { compileTemplate } from '@bench/core/compiler';
import { evaluateBatch } from '@bench/core/evaluator';
import { resolveSourceImage } from '@bench/core/source-image';
import { fetchTemplate, syncAllTemplates } from '@bench/db/templates';
import { getRegisteredTemplate } from '@bench/templates/registry';
// Keep: import { createGeminiProvider } from '@/lib/ai/providers/gemini';
// Keep: import { uploadBuffer, getPublicUrl } from '@/lib/r2';
// Keep: import { createAdminClient } from '@/lib/supabase/admin';
```

### 4.2 Update Template Module Imports

#### `prompt-bench/templates/registry.ts`
Update:
```typescript
// Before
import { ... } from './types';
import { ecommerceBase } from './templates/ecommerce-base';
import { lifestyleProduct } from './templates/lifestyle-product';

// After
import { ... } from '@bench/core/types';
import { ecommerceBase } from '@bench/templates/ecommerce-base';
import { lifestyleProduct } from '@bench/templates/lifestyle-product';
```

#### `prompt-bench/templates/ecommerce-base.ts`
Update:
```typescript
// Before
import type { PromptTemplate } from '../types';

// After
import type { PromptTemplate } from '@bench/core/types';
```

#### `prompt-bench/templates/lifestyle-product.ts`
Update:
```typescript
// Before
import type { PromptTemplate } from '../types';

// After
import type { PromptTemplate } from '@bench/core/types';
```

#### `prompt-bench/templates/index.ts`
Update:
```typescript
// Before
export { ecommerceBase } from './ecommerce-base';
export { lifestyleProduct } from './lifestyle-product';

// After (relative exports within same folder are fine)
export { ecommerceBase } from './ecommerce-base';
export { lifestyleProduct } from './lifestyle-product';
```

### 4.3 Update Database Module Imports

#### `prompt-bench/db/templates.ts`
Update:
```typescript
// Before
import { ... } from '../types';
import { ... } from '../errors';
import { getRegisteredTemplate, getRegisteredSlugs } from '../registry';

// After
import { ... } from '@bench/core/types';
import { ... } from '@bench/core/errors';
import { getRegisteredTemplate, getRegisteredSlugs } from '@bench/templates/registry';
// Keep: import { createAdminClient } from '@/lib/supabase/admin';
```

### 4.4 Update CLI Entry Point

#### `prompt-bench/cli.ts`
Update:
```typescript
// Before
import { runCommand } from './commands/run';
import { evaluateCommand } from './commands/evaluate';
// etc.

// After
import { runCommand } from '@bench/commands/run';
import { evaluateCommand } from '@bench/commands/evaluate';
import { compareCommand } from '@bench/commands/compare';
import { reportCommand } from '@bench/commands/report';
import { syncCommand } from '@bench/commands/sync';
import { testCommand } from '@bench/commands/test';
import { progressCommand } from '@bench/commands/progress';
import { insightsCommand } from '@bench/commands/insights';
```

### 4.5 Update Command File Imports

Each command file in `prompt-bench/commands/` needs similar updates.

#### `prompt-bench/commands/shared.ts`
Update:
```typescript
// Before
import { ... } from '@/lib/prompts/types';

// After
import { ... } from '@bench/core/types';
// Keep: import { createAdminClient } from '@/lib/supabase/admin';
```

#### `prompt-bench/commands/run.ts`
Update:
```typescript
// Before
import { BatchFileSchema, type BatchFile } from '@/lib/prompts/types';
import { Result, ok, err } from '@/lib/prompts/errors';
import { compileTemplate, generateIdempotencyKey } from '@/lib/prompts/compiler';
import { fetchTemplate } from '@/lib/prompts';
import { resolveSourceImage } from '@/lib/prompts/source-image';

// After
import { BatchFileSchema, type BatchFile } from '@bench/core/types';
import { Result, ok, err } from '@bench/core/errors';
import { compileTemplate, generateIdempotencyKey } from '@bench/core/compiler';
import { fetchTemplate } from '@bench/db/templates';
import { resolveSourceImage } from '@bench/core/source-image';
// Keep: import { createGeminiProvider } from '@/lib/ai/providers/gemini';
// Keep: import { uploadBuffer, getPublicUrl } from '@/lib/r2';
// Keep: import { createAdminClient } from '@/lib/supabase/admin';
```

#### `prompt-bench/commands/evaluate.ts`
Update:
```typescript
// Before
import { evaluateBatch } from '@/lib/prompts/evaluator';
import { ... } from '@/lib/prompts/types';

// After
import { evaluateBatch } from '@bench/core/evaluator';
import { ... } from '@bench/core/types';
// Keep: import { createAdminClient } from '@/lib/supabase/admin';
```

#### `prompt-bench/commands/compare.ts`
Update:
```typescript
// Before
import { welchTTest, summarize } from '@/lib/prompts/statistics';

// After
import { welchTTest, summarize } from '@bench/core/statistics';
```

#### `prompt-bench/commands/report.ts`
Update:
```typescript
// Before
import { ... } from '@/lib/prompts/types';
import { summarize, getScoreDistribution } from '@/lib/prompts/statistics';

// After
import { ... } from '@bench/core/types';
import { summarize, getScoreDistribution } from '@bench/core/statistics';
```

#### `prompt-bench/commands/sync.ts`
Update:
```typescript
// Before
import { syncAllTemplates } from '@/lib/prompts';

// After
import { syncAllTemplates } from '@bench/db/templates';
```

#### `prompt-bench/commands/test.ts`
Update:
```typescript
// Before
import { runPipeline, generateBatchLabel } from '@/lib/prompts/orchestrator';
import { ... } from '@/lib/prompts/types';

// After
import { runPipeline, generateBatchLabel } from '@bench/core/orchestrator';
import { ... } from '@bench/core/types';
```

#### `prompt-bench/commands/progress.ts`
Update:
```typescript
// Before
import { ... } from '@/lib/prompts/types';

// After
import { ... } from '@bench/core/types';
```

#### `prompt-bench/commands/insights.ts`
Update:
```typescript
// Before
import { ... } from '@/lib/prompts/types';

// After
import { ... } from '@bench/core/types';
```

### 4.6 Update Test File Imports

Each test file in `prompt-bench/__tests__/` needs updates.

#### `prompt-bench/__tests__/compiler.test.ts`
Update:
```typescript
// Before
import { compileTemplate, applyDefaults } from '../compiler';
import { isOk, isErr } from '../errors';

// After
import { compileTemplate, applyDefaults } from '@bench/core/compiler';
import { isOk, isErr } from '@bench/core/errors';
```

#### `prompt-bench/__tests__/errors.test.ts`
Update:
```typescript
// Before
import { ok, err, isOk, isErr } from '../errors';

// After
import { ok, err, isOk, isErr } from '@bench/core/errors';
```

#### `prompt-bench/__tests__/statistics.test.ts`
Update:
```typescript
// Before
import { summarize, welchTTest } from '../statistics';

// After
import { summarize, welchTTest } from '@bench/core/statistics';
```

#### `prompt-bench/__tests__/source-image.test.ts`
Update:
```typescript
// Before
import { getMimeType, computeHash, resolveSourcePath } from '../source-image';

// After
import { getMimeType, computeHash, resolveSourcePath } from '@bench/core/source-image';
```

#### `prompt-bench/__tests__/types.test.ts`
Update:
```typescript
// Before
import { BatchFileSchema, ... } from '../types';

// After
import { BatchFileSchema, ... } from '@bench/core/types';
```

## Verification
After updating all imports:
```bash
bun run tsc --noEmit  # Should pass with no errors
```

## Dependencies
- Phase 3 (Move Files) must be complete

## Next Phase
Phase 5: Create Barrel Export
