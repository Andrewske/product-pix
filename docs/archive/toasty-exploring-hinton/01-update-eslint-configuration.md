# Update ESLint Configuration

## Files to Modify
- `eslint.config.mjs` (modify)

## Implementation Details

Update the ESLint configuration to adopt industry-standard approach: require explicit return types only at module boundaries (exports), not internal implementation details.

### Current Rule (line 10)
```javascript
'@typescript-eslint/explicit-function-return-type': [
  'warn',
  {
    allowExpressions: true,
    allowTypedFunctionExpressions: true,
    allowHigherOrderFunctions: true,
  },
],
```

### Changes Required

**Step 1: Replace global rule**
```javascript
// Default: OFF (too noisy, inference works well)
'@typescript-eslint/explicit-function-return-type': 'off',
```

**Step 2: Add new override after existing overrides (after line 20)**
```javascript
{
  // Require explicit return types at module boundaries (lib + API routes)
  files: [
    'src/lib/**/*.ts',           // Library utilities
    'src/app/api/**/route.ts',   // API route handlers
    'src/hooks/**/*.ts',         // Custom hooks
  ],
  rules: {
    '@typescript-eslint/explicit-function-return-type': [
      'warn',
      {
        allowExpressions: true,                               // Allow inline callbacks
        allowTypedFunctionExpressions: true,                  // Allow typed factory functions
        allowHigherOrderFunctions: true,                      // Allow HOFs
        allowDirectConstAssertionInArrowFunctions: true,      // Allow `as const` pattern
      },
    ],
  },
},
```

## Acceptance Criteria
- [ ] Global rule is set to 'off'
- [ ] New override block added for lib/API/hooks files
- [ ] Run `bun lint` - violations should drop from 134 → ~60
- [ ] All violations remaining should be in `src/lib/`, `src/app/api/`, or `src/hooks/` files only
- [ ] No violations in `.tsx` files

## Expected Result
Violations drop from 134 → ~60 (all in library code where explicit types add value)

## Dependencies
None - this is the first task
