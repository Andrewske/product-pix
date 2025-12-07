# Phase 1: Configuration Updates

## Overview
Update TypeScript, Jest, and package.json configuration to support the new `prompt-bench/` directory with a `@bench/*` path alias.

## Tasks

### 1.1 Update tsconfig.json

**File**: `/home/kevin/coding/product-pix/tsconfig.json`

Add `@bench/*` path alias to the `paths` object:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@bench/*": ["./prompt-bench/*"]
    }
  }
}
```

### 1.2 Update jest.config.ts

**File**: `/home/kevin/coding/product-pix/jest.config.ts`

Make the following changes:

1. Add `prompt-bench` to roots:
```typescript
roots: ['<rootDir>/src', '<rootDir>/prompt-bench'],
```

2. Add `@bench/*` to moduleNameMapper:
```typescript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
  '^@bench/(.*)$': '<rootDir>/prompt-bench/$1',
},
```

3. Update collectCoverageFrom:
```typescript
collectCoverageFrom: [
  'prompt-bench/**/*.ts',
  '!prompt-bench/**/*.test.ts',
  '!prompt-bench/**/index.ts',
  '!prompt-bench/fixtures/**',
],
```

### 1.3 Update package.json

**File**: `/home/kevin/coding/product-pix/package.json`

Update the `bench` script to point to the new CLI location:

```json
{
  "scripts": {
    "bench": "tsx prompt-bench/cli.ts"
  }
}
```

## Verification
After completing this phase, run:
```bash
bun run tsc --noEmit  # Should pass (no files moved yet)
```

## Dependencies
- None (this phase runs first)

## Next Phase
Phase 2: Create Directory Structure
