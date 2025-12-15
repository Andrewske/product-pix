# PostHog Implementation Guide for ProductPix

## Overview

This document outlines PostHog analytics integration in ProductPix, including architectural decisions, implementation patterns, and best practices. Use this as a reference when adding new analytics tracking or modifying existing implementations.

**Quick Links:**
- Event Catalog: See `src/lib/analytics/events.ts`
- Developer Guide: `docs/analytics-guide.md`
- Testing Checklist: `docs/posthog-testing-checklist.md`
- A/B Testing: `docs/ab-testing-analytics.md`

---

## Core Architectural Decisions

### Decision 1: Dual SDK Pattern (Client + Server)

**What:** Use `posthog-js` for browser events, `posthog-node` for server-side events.

**Why:** Complete coverage across all user touchpoints - client interactions, server webhooks, API calls.

**Implementation:**
- Client: `src/lib/analytics/client.ts` - Tracks user interactions, pageviews, UI events
- Server: `src/lib/analytics/server.ts` - Tracks webhooks, API events, background jobs

**When to use:**
- **Client-side (`trackEvent`)**: User clicks, form submissions, pageviews, UI interactions
- **Server-side (`trackServerEvent`)**: Webhook events, API operations, background processing, payment events

### Decision 2: Runtime Validation with Zod

**What:** TypeScript types + Zod schemas for all events.

**Why:** TypeScript provides compile-time safety, Zod adds runtime validation. Catches malformed events before they reach PostHog.

**Implementation:**
```typescript
// src/lib/analytics/events.ts
export const generationStartedSchema = z.object({
  event: z.literal('generation_started'),
  properties: z.object({
    template_slug: z.string(),
    aspect_ratio: z.enum(['1:1', '2:3', '3:2', '3:4', '4:3']),
    resolution: z.enum(['1k', '2k', '4k']),
    has_source_image: z.boolean(),
  }),
});

export type GenerationStartedEvent = z.infer<typeof generationStartedSchema>;
```

**When to use:**
- **Always** define new events in `events.ts` with both TypeScript type AND Zod schema
- Validation happens automatically in `trackEvent()` and `trackServerEvent()`

### Decision 3: Privacy-First Configuration

**What:** Comprehensive masking of PII in session replays and event properties.

**Why:** Comply with privacy best practices, minimize PII collection, reduce legal liability.

**Configuration:**
```typescript
// src/lib/analytics/config.ts
{
  maskAllInputs: true,              // Mask all input fields
  maskAllText: true,                 // Mask all text content
  mask_all_element_attributes: true, // Mask HTML attributes
  person_profiles: 'identified_only', // Only track authenticated users
  session_recording: {
    maskTextSelector: '*',           // Mask all text in replays
    maskAllInputs: true,
    maskTextFn: (text) => {          // Mask URL parameters
      return text.replace(/[?#].*/, '[REDACTED]');
    }
  }
}
```

**When to use:**
- **Always** add `data-private` attribute to sensitive inputs (email, password, credit card)
- **Never** include PII in event properties - use IDs instead of emails/names
- **Always** hash IP addresses: `crypto.createHash('sha256').update(ip).digest('hex')`

### Decision 4: Keep Custom A/B Testing

**What:** Use existing localStorage-based A/B testing, track exposure in PostHog.

**Why:** Custom implementation (111 lines) is proven, provides guaranteed variant persistence, no network dependency.

**Implementation:**
```typescript
// src/lib/ab-testing.ts
import { trackEvent } from '@/lib/analytics';

export function trackABTestEvent(testName: string, variant: ABTestVariant, userId?: string) {
  trackEvent({
    event: 'ab_test_exposure',
    properties: {
      test_name: testName,
      variant: variant,
      user_id: userId,
    }
  });
}
```

**When to use:**
- **Use custom A/B testing** for variant assignment (localStorage-based)
- **Use PostHog** only for tracking exposure and analyzing conversion rates
- **Don't migrate** to PostHog feature flags - adds complexity, network dependency, breaks persistence guarantees

### Decision 5: Module-Level Server Initialization

**What:** Initialize PostHog Node client at module load, not with singleton pattern.

**Why:** Vercel serverless containers are already isolated. Module-level init is simpler and idiomatic for Next.js.

**Implementation:**
```typescript
// src/lib/analytics/posthog-server.ts
import { PostHog } from 'posthog-node';

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

**When NOT to use:**
- **Don't** use singleton pattern (unnecessary in serverless)
- **Don't** use lazy initialization (adds complexity without benefit)

### Decision 6: Use Existing Error Tracking Infrastructure

**What:** Leverage existing `captureError()` infrastructure that already sends to PostHog.

**Why:** Codebase has comprehensive three-tier error tracking (Vercel logs → DB → PostHog). No additional error boundaries needed.

**Implementation:**
- Existing: `src/lib/observability/capture-error.ts` already calls PostHog
- Existing: `src/app/error.tsx` already calls `captureError()`
- Existing: API routes already use `captureError()` (43 occurrences)

**When to use:**
- **Always** use existing `captureError()` for errors - don't create new error tracking
- **Don't** add new error boundaries - existing infrastructure is sufficient
- **Verify** PostHog integration works with existing error flows

### Decision 7: Event Queue for Webhook Analytics

**What:** In-memory queue with background worker for server-side tracking.

**Why:** Webhooks are critical path. Queue completely decouples analytics from payment processing.

**Implementation:**
```typescript
// src/lib/analytics/server.ts
const eventQueue: Array<{ userId: string; event: AnalyticsEvent }> = [];

// Background worker flushes every 10 seconds
setInterval(() => {
  const batch = eventQueue.splice(0, 20);
  batch.forEach(({ userId, event }) => {
    posthog.capture({ distinctId: userId, ...event });
  });
}, 10000);

export function trackServerEvent(userId: string, event: AnalyticsEvent): void {
  eventQueue.push({ userId, event }); // Non-blocking
}
```

**When to use:**
- **Always** use `trackServerEvent()` (queue) for webhook events
- **Always** use queue for payment processing events
- **Never** use direct PostHog calls in webhook handlers - always queue

**Why this matters:**
If PostHog is down or slow, webhook still completes successfully. Credits are granted, payment processed. Analytics failure doesn't break business logic.

### Decision 8: Vercel Integration for Source Maps

**What:** Use official PostHog Vercel integration instead of custom upload script.

**Why:** Automatic, zero maintenance, handles upload timing/retries correctly.

**Setup:**
1. Install PostHog integration in Vercel dashboard
2. Configure with PostHog project ID and API key
3. Enable in `next.config.mjs`: `productionBrowserSourceMaps: true`

**When to use:**
- **Always** use Vercel integration if available (don't write custom scripts)
- **Enable** source maps in Next.js config
- **Verify** source maps uploaded after deployment in PostHog dashboard

---

## Implementation Patterns

### Pattern 1: Client-Side Event Tracking

**When:** User interactions, UI events, navigation

**How:**
```typescript
import { trackEvent } from '@/lib/analytics';

function handleGenerationSubmit() {
  trackEvent({
    event: 'generation_started',
    properties: {
      template_slug: templateSlug,
      aspect_ratio: aspectRatio,
      resolution: resolution,
      has_source_image: !!uploadId,
    }
  });

  // ... rest of submit logic
}
```

**Rules:**
- Import from `@/lib/analytics` (barrel export)
- All property names in `snake_case`
- Event auto-validates against Zod schema
- Wrap in try-catch if not already in error boundary

### Pattern 2: Server-Side Event Tracking (Queue)

**When:** Webhooks, payment events, API operations

**How:**
```typescript
import { trackServerEvent } from '@/lib/analytics/server';

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  // Critical business logic first
  await grantCredits(userId, creditAmount);

  // Analytics after (non-blocking queue)
  trackServerEvent(userId, {
    event: 'credits_purchased',
    properties: {
      pack_id: packId,
      credits: creditAmount,
      amount_cents: paymentIntent.amount,
      payment_intent_id: paymentIntent.id,
    }
  });

  return { success: true };
}
```

**Rules:**
- Import from `@/lib/analytics/server` (queue version)
- **Never** await `trackServerEvent()` - it's fire-and-forget
- Business logic completes first, analytics second
- Queue handles errors independently

### Pattern 3: User Identification

**When:** User logs in or profile loads

**How:**
```typescript
import { useRef } from 'react';
import { identifyUser, resetUser } from '@/lib/analytics';

export function useUserProfile() {
  const identifiedRef = useRef(false);

  useEffect(() => {
    if (!user) {
      resetUser();
      identifiedRef.current = false;
    } else if (!identifiedRef.current) {
      identifyUser(user.id, {
        email: user.email,
        tier: user.tier,
        created_at: user.createdAt,
        // Do NOT include credit_balance (mutable)
      });
      identifiedRef.current = true;
    }
  }, [user]);
}
```

**Rules:**
- **Use** `useRef` to prevent duplicate identification on rerenders
- **Only** include immutable properties (email, tier, created_at)
- **Never** include mutable state (credit_balance, last_login, etc.)
- **Reset** on logout

### Pattern 4: Adding New Events

**Step 1: Define in events.ts**
```typescript
// src/lib/analytics/events.ts
export const imageUploadedSchema = z.object({
  event: z.literal('image_uploaded'),
  properties: z.object({
    file_size_bytes: z.number().int().positive(),
    mime_type: z.string(),
    upload_duration_ms: z.number().int().positive(),
  }),
});

export type ImageUploadedEvent = z.infer<typeof imageUploadedSchema>;

// Add to discriminated union
export type AnalyticsEvent =
  | GenerationStartedEvent
  | ImageUploadedEvent // Add here
  | ...;
```

**Step 2: Track in component/API**
```typescript
import { trackEvent } from '@/lib/analytics';

trackEvent({
  event: 'image_uploaded',
  properties: {
    file_size_bytes: file.size,
    mime_type: file.type,
    upload_duration_ms: Date.now() - startTime,
  }
});
```

**Step 3: Add tests**
```typescript
// src/app/upload/__tests__/upload.test.ts
it('should track image_uploaded event', () => {
  const trackEventMock = mock();

  // ... trigger upload ...

  expect(trackEventMock).toHaveBeenCalledWith({
    event: 'image_uploaded',
    properties: expect.objectContaining({
      file_size_bytes: expect.any(Number),
      mime_type: expect.any(String),
    })
  });
});
```

---

## When to Use PostHog

### ✅ DO Use PostHog For:

**User Behavior Analytics:**
- Pageviews and navigation patterns
- Feature usage (which templates, aspect ratios)
- User funnels (signup → first generation → purchase)
- Conversion rates by traffic source

**Product Metrics:**
- Generation success/failure rates
- Batch processing statistics
- Credit consumption patterns
- Error frequency by page/feature

**Business Metrics:**
- Revenue (payment events)
- Subscription lifecycle (started, cancelled)
- Customer segmentation (tier, usage level)
- Retention cohorts

**A/B Testing:**
- Track variant exposure
- Measure conversion rates by variant
- Analyze experiment results

### ❌ DON'T Use PostHog For:

**Real-Time Alerts:**
- PostHog is analytics, not monitoring
- Use existing error tracking for critical alerts

**Business-Critical Data:**
- Don't rely on PostHog for billing/payment records
- Use database as source of truth
- PostHog is analytics only (can have delays, sampling)

**PII Storage:**
- Never send emails, passwords, credit card numbers
- Use IDs instead of names/emails in properties
- Hash sensitive data (IP addresses)

**Synchronous Operations:**
- Never block user operations waiting for PostHog
- All tracking should be async/non-blocking
- Use queue pattern for critical paths

---

## Property Naming Conventions

### ✅ Correct (snake_case):
```typescript
{
  event: 'generation_completed',
  properties: {
    job_id: '123',
    template_slug: 'product-hero',
    duration_ms: 1500,
    has_source_image: true,
  }
}
```

### ❌ Incorrect (camelCase, mixed):
```typescript
{
  event: 'generation_completed',
  properties: {
    jobId: '123',           // Wrong - use snake_case
    templateSlug: 'product-hero',  // Wrong
    duration_ms: 1500,      // Correct
    hasSourceImage: true,   // Wrong
  }
}
```

**Why snake_case:**
- PostHog convention
- Consistent with SQL/database naming
- Easier to query in PostHog dashboards

---

## Privacy & Compliance Checklist

### Session Replay Masking

**Required for all sensitive inputs:**
```tsx
<input
  type="email"
  data-private  // Always add this
  // ... other props
/>

<input
  type="password"
  data-private  // Always add this
  // ... other props
/>
```

**Verification:**
Run static analysis: `bun run check-privacy`

### Event Property Privacy

**❌ Never include:**
- Email addresses
- Full names
- Credit card numbers
- IP addresses (unless hashed)
- Session tokens
- API keys

**✅ Use instead:**
- User IDs
- Hashed IP addresses
- Numeric identifiers
- Enum values (tier, status)

### User Identification Privacy

**Only immutable properties:**
```typescript
identifyUser(userId, {
  email: user.email,          // OK - immutable
  tier: user.tier,            // OK - rarely changes
  created_at: user.createdAt, // OK - immutable
  // credit_balance: user.balance, // WRONG - mutable
});
```

---

## Testing Requirements

### Unit Tests (100% coverage required for core functions)

**Core functions:**
- `trackEvent()`
- `identifyUser()`
- `resetUser()`
- `trackServerEvent()`
- `identifyUserServer()`

**Test patterns:**
```typescript
import { describe, it, expect, mock } from 'bun:test';
import { trackEvent } from '@/lib/analytics/client';

describe('trackEvent', () => {
  it('should validate event schema', () => {
    expect(() => {
      trackEvent({
        event: 'generation_started',
        properties: {
          template_slug: 'valid',
          aspect_ratio: '1:1',
          resolution: '1k',
          has_source_image: true,
        }
      });
    }).not.toThrow();
  });

  it('should reject invalid events', () => {
    expect(() => {
      trackEvent({
        event: 'generation_started',
        properties: {
          aspect_ratio: 'invalid', // Wrong enum value
        }
      });
    }).toThrow();
  });
});
```

### Integration Tests

**Required verification:**
- PostHog initializes in browser
- Events captured with correct properties
- Server-side queue flushes to PostHog
- Validation rejects invalid data

### Manual Testing

**Use checklist:** `docs/posthog-testing-checklist.md`

**Key items:**
- PostHog object exists in console
- Events appear in PostHog Live Events
- Session replays mask sensitive data
- URL parameters don't show tokens

---

## Common Pitfalls to Avoid

### ❌ Pitfall 1: Blocking Webhooks with Direct Tracking

**Wrong:**
```typescript
async function handleStripeWebhook(event) {
  await grantCredits(userId, amount);

  // This blocks webhook response if PostHog is slow
  posthog.capture({ ... });

  return { success: true };
}
```

**Right:**
```typescript
async function handleStripeWebhook(event) {
  await grantCredits(userId, amount);

  // Queue is non-blocking
  trackServerEvent(userId, {
    event: 'credits_purchased',
    properties: { ... }
  });

  return { success: true };
}
```

### ❌ Pitfall 2: Including Mutable State in User Properties

**Wrong:**
```typescript
identifyUser(userId, {
  email: user.email,
  credit_balance: user.balance, // Mutable - will be stale
  last_login: new Date(),        // Mutable - constantly changes
});
```

**Right:**
```typescript
identifyUser(userId, {
  email: user.email,
  tier: user.tier,
  created_at: user.createdAt,
});

// Track balance changes as events instead
trackEvent({
  event: 'credits_consumed',
  properties: {
    amount: creditsUsed,
    balance_after: newBalance,
  }
});
```

### ❌ Pitfall 3: Mixed Property Naming

**Wrong:**
```typescript
trackEvent({
  event: 'batch_completed',
  properties: {
    batchId: '123',      // camelCase
    success_count: 60,   // snake_case
    failedCount: 10,     // camelCase
  }
});
```

**Right:**
```typescript
trackEvent({
  event: 'batch_completed',
  properties: {
    batch_id: '123',
    success_count: 60,
    failed_count: 10,
  }
});
```

### ❌ Pitfall 4: Forgetting Validation for New Events

**Wrong:**
```typescript
// Only TypeScript type, no Zod schema
export type NewEvent = {
  event: 'new_event';
  properties: { foo: string };
};
```

**Right:**
```typescript
// Both Zod schema AND TypeScript type
export const newEventSchema = z.object({
  event: z.literal('new_event'),
  properties: z.object({
    foo: z.string(),
  }),
});

export type NewEvent = z.infer<typeof newEventSchema>;
```

### ❌ Pitfall 5: Duplicate User Identification on Rerenders

**Wrong:**
```typescript
useEffect(() => {
  if (user) {
    identifyUser(user.id, ...); // Called on every rerender!
  }
}, [user]);
```

**Right:**
```typescript
const identifiedRef = useRef(false);

useEffect(() => {
  if (user && !identifiedRef.current) {
    identifyUser(user.id, ...);
    identifiedRef.current = true;
  }
}, [user]);
```

---

## Environment Variables

### Required

```env
# Client-side (public)
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.posthog.com

# Server-side
POSTHOG_API_KEY=phc_xxx
```

### Optional

```env
# For observability toggle
OBSERVABILITY_ENABLED=true
```

---

## Performance Considerations

### Client-Side

**Bundle Size:**
- posthog-js: ~50-100KB gzipped
- Use dynamic import to lazy-load after critical path

**Initialization:**
```typescript
// Don't block initial render
const PostHog = dynamic(() => import('./posthog-init'), {
  ssr: false,
  loading: () => null,
});
```

### Server-Side

**Queue Pattern:**
- Events buffer in memory (max 1000)
- Background worker flushes every 10s
- FIFO overflow (oldest discarded first)

**Batching:**
- PostHog SDK batches automatically (flushAt: 20, flushInterval: 10s)
- Don't create custom batching logic

---

## Monitoring & Alerts

### PostHog Dashboard

**Set up:**
1. Billing alert at 80% of monthly event limit
2. Session replay sampling: 10% initially
3. Data retention: 90 days (events), 30 days (replays)

### Success Metrics

- **Coverage**: All 17 event types tracked
- **Adoption**: 100% of user flows instrumented
- **Privacy**: Zero PII leaks in session replays
- **Performance**: No degradation in page load times
- **Cost**: Stay within PostHog free tier (1M events/month)

---

## Quick Reference

### Client-Side Tracking
```typescript
import { trackEvent, identifyUser, resetUser } from '@/lib/analytics';

// Track event
trackEvent({ event: 'generation_started', properties: { ... } });

// Identify user (with useRef guard)
identifyUser(userId, { email, tier, created_at });

// Reset on logout
resetUser();
```

### Server-Side Tracking (Queue)
```typescript
import { trackServerEvent } from '@/lib/analytics/server';

// Non-blocking queue
trackServerEvent(userId, {
  event: 'credits_purchased',
  properties: { pack_id, credits, amount_cents }
});
```

### Adding New Events
1. Define in `src/lib/analytics/events.ts` (Zod + TypeScript)
2. Track in component/API
3. Add tests
4. Verify in PostHog Live Events

### Privacy Checklist
- [ ] All sensitive inputs have `data-private`
- [ ] No PII in event properties
- [ ] IP addresses hashed
- [ ] User properties are immutable only
- [ ] Static analysis passes: `bun run check-privacy`

---

## Support & Troubleshooting

### Events Not Appearing in PostHog

**Check:**
1. PostHog initializes in browser console
2. Network tab shows requests to PostHog
3. Event passes Zod validation (check console for errors)
4. NEXT_PUBLIC_POSTHOG_KEY is set correctly

### Session Replays Show Sensitive Data

**Fix:**
1. Add `data-private` attribute to fields
2. Run static analysis: `bun run check-privacy`
3. Verify masking in test recording
4. Adjust `maskTextFn` if needed

### High Event Volume / Cost

**Solutions:**
1. Review event frequency (are events firing too often?)
2. Implement sampling for high-volume events
3. Check for duplicate tracking calls
4. Review batch processing events (might be per-item instead of per-batch)

### Server-Side Queue Not Flushing

**Check:**
1. Worker is running (setInterval started)
2. POSTHOG_API_KEY is set
3. Queue not hitting overflow (max 1000)
4. PostHog API is reachable
5. Check logs for queue errors

---

## Related Documentation

- **Analytics Guide**: `docs/analytics-guide.md` - How to add new events
- **A/B Testing**: `docs/ab-testing-analytics.md` - A/B testing with PostHog
- **Testing Checklist**: `docs/posthog-testing-checklist.md` - QA verification
- **Event Definitions**: `src/lib/analytics/events.ts` - Full event catalog
- **PostHog Docs**: https://posthog.com/docs - Official documentation

---

**Last Updated:** 2025-12-14
**Plan Reference:** `docs/lovely-jumping-brook/` - Implementation task sequence
