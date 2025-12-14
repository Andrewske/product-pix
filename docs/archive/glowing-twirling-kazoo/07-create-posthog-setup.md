# Create PostHog Setup with Blocklist Sanitization and Lazy Init

## Files to Modify/Create
- `src/lib/posthog/client.ts` (new)
- `src/lib/posthog/server.ts` (new)
- `src/lib/posthog/sanitize.ts` (new)
- `src/lib/posthog/index.ts` (new - barrel export)

## Implementation Details

### PostHog Client (Browser)

Create `src/lib/posthog/client.ts`:

```typescript
import posthog from 'posthog-js';

export { posthog };

export function getPostHog(): typeof posthog | null {
  if (typeof window === 'undefined') return null;
  return posthog;
}
```

### PostHog Server (Node.js) with Lazy Initialization

Create `src/lib/posthog/server.ts`:

```typescript
import { PostHog } from 'posthog-node';
import { env } from '@/lib/env';

let _client: PostHog | null = null;
let _shutdownRegistered = false;

export function getPostHogServer(): PostHog | null {
  if (!env.OBSERVABILITY_ENABLED || !env.POSTHOG_API_KEY) {
    return null;
  }

  if (!_client) {
    _client = new PostHog(env.POSTHOG_API_KEY, {
      host: env.POSTHOG_HOST || 'https://app.posthog.com',
      flushAt: 20,
      flushInterval: 10000,
    });

    // Register graceful shutdown handler once
    if (!_shutdownRegistered) {
      _shutdownRegistered = true;
      process.on('SIGTERM', async () => {
        await _client?.shutdown();
      });
    }
  }

  return _client;
}
```

### PII Sanitization with Blocklist Approach

Create `src/lib/posthog/sanitize.ts`:

```typescript
// Fields that should NEVER be sent to PostHog
const BLOCKLIST_FIELDS = [
  /email/i,
  /password/i,
  /token/i,
  /secret/i,
  /key/i,
  /credential/i,
  /card/i,
  /cvv/i,
  /ssn/i,
  /phone/i,
  /address/i,
  /authorization/i,
  /cookie/i,
  /session/i,
  /^ip$/i,
];

// Patterns to redact in string values
const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  ip: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
  card: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  token: /\b[a-zA-Z0-9_-]{32,}\b/g,
  uuid: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
};

export function sanitizeForPostHog(
  context: Record<string, unknown>
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(context)) {
    // Skip blocklisted field names
    if (BLOCKLIST_FIELDS.some(pattern => pattern.test(key))) {
      continue;
    }

    // Recursively sanitize the value
    sanitized[key] = sanitizeValue(value);
  }

  return sanitized;
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    let sanitized = value;

    // Redact email addresses
    sanitized = sanitized.replace(PII_PATTERNS.email, '[EMAIL]');

    // Redact IP addresses
    sanitized = sanitized.replace(PII_PATTERNS.ip, '[IP]');

    // Redact credit card numbers
    sanitized = sanitized.replace(PII_PATTERNS.card, '[CARD]');

    // Redact long tokens, but keep UUIDs (useful for debugging)
    sanitized = sanitized.replace(PII_PATTERNS.token, (match) => {
      // Reset lastIndex for global regex
      PII_PATTERNS.uuid.lastIndex = 0;
      return PII_PATTERNS.uuid.test(match) ? match : '[TOKEN]';
    });

    return sanitized;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === 'object') {
    return sanitizeForPostHog(value as Record<string, unknown>);
  }

  return value;
}
```

### Barrel Export

Create `src/lib/posthog/index.ts`:

```typescript
export { posthog, getPostHog } from './client';
export { getPostHogServer } from './server';
export { sanitizeForPostHog } from './sanitize';
```

## Design Decisions

### Lazy Initialization
- PostHog server client is NOT created at module load
- Prevents crashes when env vars are missing
- Creates client on first use, reuses thereafter

### Blocklist vs Allowlist
- **Blocklist approach**: Remove known PII field names
- **Value sanitization**: Redact PII patterns in remaining strings
- **Preserves debugging context**: Fields like `errorDetails`, `componentName` are kept
- **UUIDs preserved**: Useful for correlation, not PII

## Acceptance Criteria
- [ ] PostHog client exports posthog and getPostHog()
- [ ] PostHog server uses lazy initialization (getPostHogServer())
- [ ] Server returns null if OBSERVABILITY_ENABLED=false or key missing
- [ ] SIGTERM handler for graceful shutdown
- [ ] sanitizeForPostHog() uses blocklist approach
- [ ] Blocklisted fields (email, password, etc.) filtered out
- [ ] String values have PII redacted ([EMAIL], [IP], [CARD], [TOKEN])
- [ ] UUIDs preserved in string values
- [ ] Recursive sanitization for nested objects/arrays
- [ ] Barrel export includes all exports

## Dependencies
- Task 01 (posthog-js, posthog-node installed)
- Task 09 (env vars defined)
