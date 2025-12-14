# Add Environment Variables for PostHog

## Files to Modify/Create
- `src/lib/env.ts` (modify)
- `.env.example` (modify)
- `src/lib/observability/validate-config.ts` (new)

## Implementation Details

### Update env.ts with Simple Schema

Add PostHog environment variables with simple validation (no complex refine logic):

```typescript
// Observability control
OBSERVABILITY_ENABLED: z.string().optional().default('false').transform(val => val === 'true'),

// PostHog server (Node.js)
POSTHOG_API_KEY: z.string().optional(),
POSTHOG_HOST: z.string().url().optional().default('https://app.posthog.com'),

// PostHog client (browser)
NEXT_PUBLIC_POSTHOG_API_KEY: z.string().optional(),
NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional().default('https://app.posthog.com'),
```

### Runtime Validation Function

Create `src/lib/observability/validate-config.ts` for production validation:

```typescript
import { env } from '@/lib/env';

export function validateObservabilityConfig(): void {
  // Only validate in production when observability is enabled
  if (process.env.NODE_ENV !== 'production') return;
  if (!env.OBSERVABILITY_ENABLED) return;

  const errors: string[] = [];

  if (!env.POSTHOG_API_KEY) {
    errors.push('POSTHOG_API_KEY required in production when OBSERVABILITY_ENABLED=true');
  }

  if (!env.NEXT_PUBLIC_POSTHOG_API_KEY) {
    errors.push('NEXT_PUBLIC_POSTHOG_API_KEY required in production when OBSERVABILITY_ENABLED=true');
  }

  if (errors.length > 0) {
    throw new Error(`Observability configuration errors:\n${errors.join('\n')}`);
  }
}
```

Call from `instrumentation.ts` or app startup:

```typescript
// src/instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateObservabilityConfig } = await import('@/lib/observability/validate-config');
    validateObservabilityConfig();
  }
}
```

### Update .env.example

```bash
# Observability (set to 'true' to enable PostHog)
OBSERVABILITY_ENABLED=false

# PostHog (required in production when OBSERVABILITY_ENABLED=true)
POSTHOG_API_KEY=
POSTHOG_HOST=https://app.posthog.com
NEXT_PUBLIC_POSTHOG_API_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

## Design Decisions

### Simple Zod Schema
- No complex `refine()` with process.env checks
- Avoids timing issues with when env vars are populated
- All PostHog vars are optional in schema

### Runtime Validation
- Validates at app startup, not schema parse time
- Only runs in production with OBSERVABILITY_ENABLED=true
- Throws clear error with all missing vars listed

### Default Disabled
- OBSERVABILITY_ENABLED defaults to 'false'
- Local dev works without PostHog setup
- Must explicitly enable for production

## Acceptance Criteria
- [ ] OBSERVABILITY_ENABLED env var added (defaults to false)
- [ ] POSTHOG_API_KEY optional in schema
- [ ] POSTHOG_HOST with default
- [ ] NEXT_PUBLIC_POSTHOG_API_KEY optional in schema
- [ ] NEXT_PUBLIC_POSTHOG_HOST with default
- [ ] validateObservabilityConfig() function created
- [ ] Runtime validation fails fast in production if keys missing
- [ ] .env.example updated with all PostHog vars
- [ ] instrumentation.ts calls validateObservabilityConfig()

## Dependencies
None (environment configuration is independent)
