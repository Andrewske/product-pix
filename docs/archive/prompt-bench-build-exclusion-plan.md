# Prompt-Bench Build Exclusion Implementation Plan

## Overview

Exclude the `prompt-bench/` CLI tooling directory from Next.js production builds while maintaining full functionality for development and testing. This allows deployment to Vercel without prompt-bench TypeScript errors blocking the build, while preserving the tight integration between the CLI tools and the main application infrastructure.

## Architecture Decisions

### Decision 1: Keep Monorepo Structure (No Separation)
**Rationale**: prompt-bench is ProductPix-specific dev tooling with tight coupling to:
- Supabase schema (prompt_templates, prompt_tests, generated_images tables)
- R2 storage infrastructure
- Gemini AI provider configuration
- Application pricing logic

Separating into workspaces or separate packages would add synchronization overhead (version bumping, package publishing) without meaningful benefits. The one-way dependency flow (prompt-bench → src/) is clean and maintainable.

### Decision 2: Dual TypeScript Configs
**Rationale**: Create `tsconfig.build.json` that extends root config but excludes prompt-bench. This allows:
- Next.js builds to ignore prompt-bench TypeScript errors
- CLI commands (`bun bench`) to use root config via tsx runtime
- Bun test to continue testing both src/ and prompt-bench/
- Future flexibility to separate if requirements change

### Decision 3: Eliminate Reverse Dependencies (Completed)
**Rationale**: The `src/lib/pricing/calculator.ts` previously imported from `@bench/core/errors`. TypeScript follows imports during compilation regardless of tsconfig exclude patterns. This was resolved by refactoring `calculateCost` to use try/catch (aligning with the app's error handling convention) and creating a wrapper in `prompt-bench/core/cost.ts` for backwards compatibility. The dead barrel export `src/lib/prompts/index.ts` was also deleted.

### Decision 4: No ESLint Import Restrictions (Yet)
**Rationale**: Defer adding eslint-plugin-import rules until there's evidence of unwanted coupling. After extracting the Result type, there will be zero reverse dependencies.

## Implementation Tasks

### Phase 1: TypeScript Configuration

- [ ] Create tsconfig.build.json for Next.js builds
  - Files: `/home/kevin/coding/product-pix/tsconfig.build.json` (new)
  - Content: Extend root tsconfig.json, add prompt-bench to exclude array
  - Tests: N/A (configuration file)
  - Acceptance: File exists and is valid JSON, properly extends root config

- [ ] Update Next.js config to use build tsconfig
  - Files: `/home/kevin/coding/product-pix/next.config.ts` (modify)
  - Changes: Add `typescript.tsconfigPath: './tsconfig.build.json'` to nextConfig object
  - Tests: N/A (configuration file)
  - Acceptance: Next.js recognizes the custom tsconfig path

### Phase 2: Verification

- [ ] Verify Next.js build succeeds
  - Command: `bun run build`
  - Expected: Build completes successfully, .next/ directory created
  - Verification: Check build logs don't mention prompt-bench/ errors
  - Acceptance: Exit code 0, no TypeScript errors in build output

- [ ] Verify Next.js actually uses tsconfig.build.json
  - Method: Temporarily add a type error to prompt-bench (e.g., `const x: string = 123;`)
  - Command: `bun run build`
  - Expected: Build succeeds despite the deliberate error in prompt-bench
  - Cleanup: Remove the deliberate error after verification
  - Acceptance: Build ignores prompt-bench type errors

- [ ] Verify prompt-bench CLI functionality
  - Command: `bun bench sync`
  - Expected: Templates sync to database without errors
  - Verification: Check Supabase prompt_templates table updated
  - Acceptance: CLI executes successfully, no module resolution errors

- [ ] Verify Bun test suite runs
  - Command: `bun test prompt-bench`
  - Expected: All prompt-bench tests execute
  - Verification: Check test output shows prompt-bench test files found
  - Acceptance: Tests run (pass/fail doesn't matter for this verification)

- [ ] Verify full test suite coverage
  - Command: `bun test --coverage`
  - Expected: Coverage includes both src/ and prompt-bench/ files
  - Verification: Check coverage report has entries for prompt-bench/
  - Acceptance: Coverage metrics include prompt-bench modules

- [ ] Verify Vercel deployment succeeds
  - Command: `vercel build` (or push to branch and check Vercel dashboard)
  - Expected: Vercel build completes without TypeScript errors
  - Verification: Check Vercel build logs confirm tsconfig.build.json is used
  - Acceptance: Deployment preview is accessible

### Phase 3: Documentation

- [ ] Document architecture decision in CLAUDE.md
  - Files: `/home/kevin/coding/product-pix/CLAUDE.md` (modify)
  - Section: Add "Architecture Decision: prompt-bench Integration" after "Architecture"
  - Content: Explain build exclusion strategy, why monorepo is preferred, one-way dependencies
  - Tests: N/A (documentation)
  - Acceptance: Section clearly explains the dual-tsconfig approach and rationale

- [ ] Add build troubleshooting to CLAUDE.md Gotchas
  - Files: `/home/kevin/coding/product-pix/CLAUDE.md` (modify)
  - Section: Add to "Gotchas" section
  - Content: "Next.js build uses tsconfig.build.json (excludes prompt-bench/), CLI uses root tsconfig.json"
  - Tests: N/A (documentation)
  - Acceptance: Gotcha clearly states which config is used when

### Phase 4: Optional Enhancements (Defer to Later)

- [ ] Add ESLint import restrictions (optional)
  - Files: `eslint.config.mjs` (modify)
  - Changes: Install eslint-plugin-import, add no-restricted-paths rule
  - Purpose: Prevent src/ from importing prompt-bench internals
  - Acceptance: ESLint errors if src/ imports @bench/* directly
  - **Status**: SKIP for initial implementation

## Acceptance Criteria

### Must Have
- [x] Zero reverse dependencies (calculator refactored to try/catch, wrapper in prompt-bench/core/cost.ts)
- [x] Dead code removed (src/lib/prompts/index.ts deleted)
- [ ] Next.js build succeeds without prompt-bench TypeScript errors
- [ ] CLI commands (`bun bench *`) execute successfully
- [ ] Bun test runs for both src/ and prompt-bench/
- [ ] No breaking changes to existing functionality
- [ ] Documentation updated in CLAUDE.md
- [ ] Vercel deployment succeeds

### Nice to Have
- [ ] ESLint enforces one-way dependency flow

## Files to Create/Modify

### Create
1. `/home/kevin/coding/product-pix/tsconfig.build.json`
   - Extends root tsconfig
   - Excludes prompt-bench/ directory

### Modify
2. `/home/kevin/coding/product-pix/next.config.ts`
   - Add typescript.tsconfigPath config option

3. `/home/kevin/coding/product-pix/CLAUDE.md`
   - Add architecture decision section
   - Update gotchas with tsconfig usage

### Already Completed
- `src/lib/pricing/calculator.ts` - Refactored to use try/catch instead of Result type
- `prompt-bench/core/cost.ts` - Created wrapper that returns Result type for prompt-bench compatibility
- `src/lib/prompts/index.ts` - Deleted (was dead code)

### No Changes Required
- `/home/kevin/coding/product-pix/tsconfig.json` (root config unchanged)
- Jest configuration removed (migrated to Bun test)
- `/home/kevin/coding/product-pix/package.json` (scripts unchanged)
- `/home/kevin/coding/product-pix/prompt-bench/cli.ts` (tsx runs without type-checking)

## Dependencies

### External Dependencies
- None (uses existing Next.js, TypeScript, bun)

### Internal Dependencies
- Requires Next.js ≥13.0 (supports typescript.tsconfigPath config)
- Assumes bun package manager (confirmed in package.json)
- Assumes tsx for CLI execution (confirmed in package.json scripts)

### Task Dependencies
1. Phase 1 must complete before Phase 2 (verification needs configs)
2. Phase 2 verification must pass before Phase 3 documentation
3. Phase 4 is independent and optional

## Testing Strategy

### Manual Testing Checklist
```bash
# After tsconfig changes (Phase 1-2)
# 1. Build Next.js app
bun run build
# Expected: Success, no prompt-bench errors in output

# 2. Verify tsconfig.build.json is used (add deliberate error to prompt-bench)
echo "const x: string = 123;" >> prompt-bench/core/types.ts
bun run build
# Expected: Build succeeds despite the error
git checkout prompt-bench/core/types.ts  # cleanup

# 3. Run CLI command
bun bench sync
# Expected: Templates sync successfully

# 4. Run specific test
bun test prompt-bench/__tests__/compiler.test.ts
# Expected: Tests execute (pass or fail)

# 5. Check coverage
bun test --coverage
# Expected: Coverage report includes prompt-bench files

# 6. Start dev server
bun dev
# Expected: Server starts, no type errors on save

# 7. Verify Vercel deployment
vercel build  # or push to branch
# Expected: Build succeeds
```

### Automated Testing
- Bun test continues to run via `bun test` (uses root tsconfig)
- No new test files needed (configuration change only)
- CI/CD should verify `bun run build` succeeds

## Future Considerations

### If Separation Becomes Necessary

This approach doesn't prevent future separation. Migration paths:

**Option A: Bun Workspaces**
```
product-pix/
├─ packages/
│  ├─ app/          # Next.js (was src/)
│  ├─ bench/        # CLI (was prompt-bench/)
│  └─ shared/       # Common code
├─ package.json     # Workspace root
└─ tsconfig.json    # Shared config
```

**Option B: Separate Repository**
- Extract prompt-bench to own repo
- Publish as private npm package
- Import in ProductPix as dev dependency

### If Stricter Boundaries Needed

Add ESLint rule:
```javascript
"import/no-restricted-paths": [
  "error",
  {
    "zones": [
      {
        "target": "./src",
        "from": "./prompt-bench",
        "except": ["./prompt-bench/index.ts"]
      }
    ]
  }
]
```

## Notes for Implementer

1. **Reverse dependencies eliminated**: The calculator was refactored to use try/catch, and a wrapper exists in `prompt-bench/core/cost.ts`. No `@bench/*` imports remain in `src/`.

2. **Test incrementally**: Verify each phase before moving to next.

3. **Check Vercel logs**: After deployment, confirm Vercel build uses correct tsconfig (logs should show tsconfig.build.json).

4. **Monitor bundle size**: Next.js should NOT bundle prompt-bench code. Check `.next/` directory doesn't contain prompt-bench modules.
