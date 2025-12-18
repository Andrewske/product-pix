# Update Configuration and Types

## Files to Modify/Create
- `src/lib/pricing/pricing.config.ts` (modify - TypeScript credit config, NOT prompt-bench.toml)
- `src/lib/pricing/credits.ts` (modify)
- `src/lib/pricing/types.ts` (modify)
- `src/lib/pricing/index.ts` (modify - add barrel exports)

## Implementation Details

### 1. Update `src/lib/pricing/pricing.config.ts`

**Current structure:**
```typescript
creditsPerResolution: { '1k': 1, '2k': 2, '4k': 3 }
```

**New structure:**
```typescript
generationCosts: {
  lightning: { '1k': 30, '2k': 60, '4k': 120 },
  snail: { '1k': 15, '2k': 30, '4k': 60 }
},
addonCosts: {
  // Future features
  titleGeneration: 50,
  fancyBackground: 10
}
```

**Key changes:**
- Rename `creditsPerResolution` → `generationCosts`
- Add `mode` dimension (lightning/snail) - pricing tiers, not processing methods
- Add `addonCosts` object for future features
- Update Zod validation schema to match new structure
- Credit costs with 1.5x margin applied to infrastructure costs

**Important Note:**
- This file (`src/lib/pricing/pricing.config.ts`) contains **user credit pricing**
- Separate from `prompt-bench.toml` which contains **AI model token pricing**
- No changes needed to prompt-bench.toml for this task

### 2. Update `src/lib/pricing/credits.ts`

**Add new types:**
```typescript
export type GenerationMode = 'lightning' | 'snail';

// Derive addon names from config for type safety
type AddonName = keyof typeof creditEconomy.addonCosts;

export type GenerationParams = {
  resolution: Resolution;
  mode: GenerationMode;
  addons?: Array<AddonName>;
};

export type GenerationCostBreakdown = {
  baseGeneration: number;
  addons: Array<{ name: string; credits: number }>;
  total: number;
};
```

**Note on addon types:**
- Use `keyof typeof creditEconomy.addonCosts` to derive addon names from config
- Adding a new addon only requires updating the config, not the types
- Maintains type safety while reducing duplication

**Add new functions:**
```typescript
export function getCreditsForGeneration(resolution: Resolution, mode: GenerationMode): number {
  return creditEconomy.generationCosts[mode][resolution];
}

export function calculateGenerationCost(params: GenerationParams): GenerationCostBreakdown {
  const baseGeneration = creditEconomy.generationCosts[params.mode][params.resolution];
  const addons = (params.addons || []).map(addon => ({
    name: addon,
    credits: creditEconomy.addonCosts[addon]
  }));
  const total = baseGeneration + addons.reduce((sum, a) => sum + a.credits, 0);

  return { baseGeneration, addons, total };
}
```

**Remove deprecated functions:**
- `getCreditsForResolution()` - replaced by `getCreditsForGeneration(resolution, mode)`
- `calculateBatchCredits()` - replaced by inline calculation using `calculateGenerationCost()`

**Rationale:**
- Cleaner codebase with one clear way to calculate costs
- Old functions don't support modes, would create confusion
- Inline calculation is more flexible and supports future addons

### 3. Update `src/lib/pricing/types.ts`

Add the new type exports (single source of truth for types):
```typescript
export type GenerationMode = 'lightning' | 'snail';
export type GenerationParams = {
  resolution: Resolution;
  mode: GenerationMode;
  addons?: Array<string>; // Specific type derived in credits.ts
};
export type GenerationCostBreakdown = {
  baseGeneration: number;
  addons: Array<{ name: string; credits: number }>;
  total: number;
};
```

**Note:**
- Define `GenerationMode` ONCE in types.ts
- Import in credits.ts (don't redefine)
- Avoids duplicate type definitions

### 4. Update `src/lib/pricing/index.ts`

Add barrel exports for new types and functions:
```typescript
export type { GenerationMode, GenerationParams, GenerationCostBreakdown } from './types';
export { getCreditsForGeneration, calculateGenerationCost } from './credits';
export { creditEconomy } from './pricing.config';
```

**Rationale:**
- Follows project convention (CLAUDE.md: "Barrel exports: All lib modules via index.ts")
- Provides consistent import path: `import { GenerationMode } from '@/lib/pricing'`
- Single source of truth for public API

## Acceptance Criteria

- [ ] `creditEconomy` config loads without Zod validation errors
- [ ] `generationCosts.lightning` contains: 1k=30, 2k=60, 4k=120
- [ ] `generationCosts.snail` contains: 1k=15, 2k=30, 4k=60
- [ ] `addonCosts` contains placeholder values for future features
- [ ] `getCreditsForGeneration('1k', 'lightning')` returns 30
- [ ] `getCreditsForGeneration('1k', 'snail')` returns 15
- [ ] `calculateGenerationCost()` returns correct breakdown structure
- [ ] Addon type is derived from config using `keyof typeof`
- [ ] `GenerationMode` defined once in types.ts, not duplicated
- [ ] New types and functions exported from `@/lib/pricing/index.ts`
- [ ] Old functions `getCreditsForResolution()` and `calculateBatchCredits()` removed
- [ ] No TypeScript compilation errors

## Dependencies

**Requires completion of:** Task 00 - Audit Existing Usage

Must know all files that reference old config/functions before making changes.
