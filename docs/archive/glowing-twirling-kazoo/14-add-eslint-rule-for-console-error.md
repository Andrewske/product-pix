# Add ESLint Rule to Ban console.error in API Routes

## Files to Modify/Create
- `.eslintrc.json` or `eslint.config.js` (modify - whichever exists)

## Implementation Details

Add ESLint rule to ban `console.error` in API routes and lib code, while allowing it in components for development:

**If using .eslintrc.json:**
```json
{
  "overrides": [
    {
      "files": ["src/app/api/**/*.ts", "src/lib/**/*.ts"],
      "rules": {
        "no-console": ["error", { "allow": ["warn", "info"] }]
      }
    }
  ]
}
```

**If using eslint.config.js (flat config):**
```javascript
export default [
  // ... existing config
  {
    files: ["src/app/api/**/*.ts", "src/lib/**/*.ts"],
    rules: {
      "no-console": ["error", { "allow": ["warn", "info"] }]
    }
  }
];
```

This enforces use of structured logging (logger.error()) in critical code paths while allowing `console.log` for quick debugging in components.

## Acceptance Criteria
- [ ] ESLint rule added for API routes and lib code
- [ ] console.error banned in src/app/api/**/*.ts
- [ ] console.error banned in src/lib/**/*.ts
- [ ] console.warn and console.info still allowed
- [ ] console.log allowed in components (not restricted)
- [ ] ESLint passes after all migrations complete

## Dependencies
- Task 13 (all console.error uses migrated)
