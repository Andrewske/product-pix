# PostHog Configuration and Providers

## Files to Modify/Create
- `src/lib/analytics/config.ts` (new)
- `src/lib/analytics/posthog-provider.tsx` (new)
- `src/lib/analytics/posthog-server.ts` (new)
- `src/lib/analytics/__tests__/config.test.ts` (new)
- `src/lib/analytics/__tests__/posthog-provider.test.tsx` (new)
- `src/lib/analytics/__tests__/posthog-server.test.ts` (new)

## Implementation Details

### Task 1.5: Create PostHog Configuration Utilities

Create `src/lib/analytics/config.ts` with configuration builders:

**Functions (each ≤20 lines):**
- `createClientConfig()`: Returns PostHog browser config object (~15 lines)
- `createServerConfig()`: Returns PostHog Node config object (~10 lines)

**Privacy Settings:**
```typescript
{
  maskAllInputs: true,
  maskAllText: true,
  mask_all_element_attributes: true,
  person_profiles: 'identified_only',
  session_recording: {
    maskTextSelector: '*',
    maskAllInputs: true
  }
}
```

### Task 1.6: Create Client-Side PostHog Provider

Create `src/lib/analytics/posthog-provider.tsx` with small, focused functions:

**Functions (each ≤20 lines):**
- `usePostHogInit()`: Hook to initialize PostHog on mount (~15 lines)
- `usePageviewTracking()`: Hook to track route changes (~15 lines)
- `PostHogProvider`: Provider wrapper component (~10 lines)

**Features:**
- Dynamic import PostHog (lazy load after critical path renders)
- Initialize PostHog with privacy-first config from createClientConfig()
- Auto-capture pageviews on route changes AND initial mount
- Debug mode in development
- Event queue that buffers events until PostHog ready, then flushes

**Dependencies:** Next.js usePathname, useSearchParams hooks, next/dynamic

### Task 1.7: Create Server-Side PostHog Client

Create `src/lib/analytics/posthog-server.ts` with module-level initialization:

```typescript
import { PostHog } from 'posthog-node';
import { env } from '@/lib/env';
import { createServerConfig } from './config';

let client: PostHog | null = null;

if (env.POSTHOG_API_KEY) {
  client = new PostHog(env.POSTHOG_API_KEY, createServerConfig());

  process.on('SIGTERM', () => client?.shutdown());
  process.on('SIGINT', () => client?.shutdown());
}

export function getPostHogServer(): PostHog | null {
  return client;
}
```

**Features:**
- Module-level initialization (no singleton pattern)
- Graceful error handling if API key missing
- Shutdown handler for cleanup

## Acceptance Criteria
- Config functions return valid PostHog options, ≤20 lines each
- Client config has correct privacy settings
- Server config has batching enabled (flushAt: 20, flushInterval: 10000)
- Provider wraps app without errors
- Pageviews tracked on mount and route change
- Functions split to ≤20 lines
- Module-level pattern works
- Graceful degradation when API key missing

## Tests Required

### `src/lib/analytics/__tests__/config.test.ts`:
- Test: Client config has correct privacy settings
- Test: Server config has batching enabled

### `src/lib/analytics/__tests__/posthog-provider.test.tsx`:
- Test: PostHog initializes with correct config
- Test: Pageview captured on initial mount
- Test: Pageview captured on route change
- Test: Debug mode enabled in dev
- Test: Events queued before init, flushed after

### `src/lib/analytics/__tests__/posthog-server.test.ts`:
- Test: Returns client when API key present
- Test: Returns null if API key missing
- Test: Shutdown closes client

## Dependencies
- Task 02 (event definitions) must be complete
