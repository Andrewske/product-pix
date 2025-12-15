# Initial Setup and Dependencies

## Files to Modify/Create
- `package.json` (modify - add dependencies)
- `src/lib/env.ts` (modify - add PostHog env vars)

## Implementation Details

### Task 1.1: Verify Next.js 16 Compatibility
- Check PostHog docs and GitHub for Next.js 16 / React 19 compatibility
- Search PostHog docs for "Next.js 16" or "React 19"
- Check GitHub issues for compatibility reports
- Verify both posthog-js and posthog-node support current versions

### Task 1.2: Install Dependencies
- Command: `bun add posthog-js posthog-node`
- Verify dependencies listed in package.json with latest stable versions

### Task 1.3: Environment Configuration
Add PostHog environment variables to env schema in `src/lib/env.ts`:

```typescript
// Add to envSchema object
NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1),
NEXT_PUBLIC_POSTHOG_HOST: z.string().url().default('https://us.posthog.com'),
POSTHOG_API_KEY: z.string().min(1).optional(), // Server-side key
```

## Acceptance Criteria
- No blocking compatibility issues found with Next.js 16 / React 19
- Dependencies installed successfully in package.json
- TypeScript types include new env vars
- Env validation passes with PostHog vars

## Dependencies
None - this is the foundation for all subsequent tasks
