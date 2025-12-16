# Update ESLint Configuration for Test Files

## Files to Modify
- `eslint.config.mjs` (modify - lines 20-34)

## Implementation Details

Add the `@next/next/no-img-element` rule to the existing test file override block to allow plain `<img>` tags in test mocks.

**Location:** Lines 20-34 (existing test file override block)

**Current code:**
```javascript
{
  files: ["**/__tests__/**", "**/*.test.ts", "**/*.test.tsx"],
  rules: {
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      }
    ],
  },
},
```

**Updated code:**
```javascript
{
  files: ["**/__tests__/**", "**/*.test.ts", "**/*.test.tsx"],
  rules: {
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      }
    ],
    "@next/next/no-img-element": "off",  // NEW: Allow img tags in test mocks
  },
},
```

## Rationale

- Test files intentionally mock `next/image` to avoid complex optimization logic
- Plain `<img>` tags are appropriate in test mocks since they're not rendered in production
- This follows the standard pattern already established in the ESLint config for test-specific overrides

## Acceptance Criteria

- ESLint configuration updated with new rule
- No ESLint errors when running `bun run lint` on test files using `<img>` tags
- Build succeeds: `bun run tsc` passes

## Dependencies

None - this is the foundational configuration change
