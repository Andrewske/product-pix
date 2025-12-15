# Fix TypeScript `any` Types in validate-models.ts

## Priority
**MEDIUM** - Linting failure (4 errors blocking CI)

## Files to Modify
- `scripts/validate-models.ts` (modify lines 33, 38, 56)

## Implementation Details

**Issue:** 4 explicit `any` type errors failing linting with `@typescript-eslint/no-explicit-any`

**Solution:** Add proper type definitions for TOML pricing config structure

### 1. Add type definitions after imports (after line 3)

```typescript
interface PricingModelConfig {
  input: number;
  output: number;
  [key: string]: unknown;
}

interface TomlConfig {
  pricing?: {
    anthropic?: Record<string, PricingModelConfig>;
    openai?: Record<string, PricingModelConfig>;
    google?: Record<string, PricingModelConfig>;
    [key: string]: Record<string, PricingModelConfig> | undefined;
  };
  defaults?: {
    improvement_model?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
```

### 2. Fix line 33 - loadFullConfig return type

```typescript
// Before
function loadFullConfig(): { pricing: Record<string, Record<string, any>>; defaults: Record<string, any> } {

// After
function loadFullConfig(): { pricing: Record<string, Record<string, PricingModelConfig>>; defaults: Record<string, unknown> } {
```

### 3. Fix line 38 - TOML parse type assertion

```typescript
// Before
const parsed = parse(fileContent) as any;

// After
const parsed = parse(fileContent) as TomlConfig;
```

### 4. Fix line 56 - getConfiguredModels parameter type

```typescript
// Before
function getConfiguredModels(pricingConfig: Record<string, Record<string, any>>): Set<string> {

// After
function getConfiguredModels(pricingConfig: Record<string, Record<string, PricingModelConfig>>): Set<string> {
```

**Reasoning:**
- Provides proper typing for TOML structure
- Uses `unknown` for dynamic keys (safer than `any`)
- Satisfies TypeScript strict mode
- Matches actual pricing config structure in `prompt-bench.toml`

## Acceptance Criteria
- [ ] Type interfaces added after imports
- [ ] All 4 function signatures updated with proper types
- [ ] `bun run lint` shows 0 errors (currently 4)
- [ ] `bun run tsc` passes type checking
- [ ] Script still executes correctly: `bun run scripts/validate-models.ts`

## Dependencies
None - standalone TypeScript fix
