---
name: posthog-analytics
description: PostHog analytics patterns for ProductPix. Use when adding analytics events, tracking user behavior, debugging PostHog issues, or making server-side vs client-side tracking decisions. Covers event validation with Zod, privacy masking, webhook queue patterns, and A/B test exposure tracking. Triggers on analytics/, events.ts, trackEvent, trackServerEvent, identifyUser, PostHog, session replay, or questions about tracking, metrics, conversion funnels. (project)
---

# PostHog Analytics - ProductPix

## Quick Start

**Client-side tracking:**
```typescript
import { trackEvent } from '@/lib/analytics';

trackEvent({
  event: 'generation_started',
  properties: {
    template_slug: templateSlug,
    aspect_ratio: aspectRatio,      // Always snake_case
    resolution: resolution,
    has_source_image: !!uploadId,
  }
});
```

**Server-side tracking (webhooks/API):**
```typescript
import { trackServerEvent } from '@/lib/analytics/server';

// Non-blocking queue - never await
trackServerEvent(userId, {
  event: 'credits_purchased',
  properties: { pack_id: packId, credits: amount }
});
```

## Core Architecture Decisions

### 1. Dual SDK Pattern
- **Client** (`posthog-js`): User clicks, pageviews, UI events
- **Server** (`posthog-node`): Webhooks, API operations, background jobs

### 2. Zod Runtime Validation
All events have TypeScript types AND Zod schemas in `src/lib/analytics/events.ts`. Validation happens automatically in `trackEvent()` and `trackServerEvent()`.

### 3. Privacy-First
- `maskAllInputs: true`, `maskAllText: true` in session replays
- `person_profiles: 'identified_only'`
- Hash IP addresses, never include PII in properties

### 4. Custom A/B Testing Stays Custom
Use existing localStorage-based A/B testing. PostHog only tracks exposure:
```typescript
trackEvent({
  event: 'ab_test_exposure',
  properties: { test_name: testName, variant: variant }
});
```

### 5. Event Queue for Webhooks
Server-side uses in-memory queue with background flush. Analytics failure never breaks business logic.

### 6. Existing Error Infrastructure
Use `captureError()` from `src/lib/observability/capture-error.ts` - it already sends to PostHog. Don't create new error tracking.

## Workflow: Adding New Events

### Step 1: Define in events.ts
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
  | ImageUploadedEvent  // Add here
  | ...;
```

### Step 2: Track in Component/API
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

### Step 3: Add Tests
```typescript
it('should track image_uploaded event', () => {
  const trackEventMock = mock();
  // ... trigger upload ...
  expect(trackEventMock).toHaveBeenCalledWith({
    event: 'image_uploaded',
    properties: expect.objectContaining({
      file_size_bytes: expect.any(Number),
    })
  });
});
```

### Step 4: Verify
Check PostHog Live Events after deployment.

## Workflow: User Identification

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
        email: user.email,        // OK - immutable
        tier: user.tier,          // OK - rarely changes
        created_at: user.createdAt,
        // credit_balance: WRONG - mutable, use events instead
      });
      identifiedRef.current = true;
    }
  }, [user]);
}
```

**Rules:**
- Use `useRef` to prevent duplicate calls on rerenders
- Only immutable properties (email, tier, created_at)
- Track mutable state changes as events, not user properties

## Workflow: Webhook Analytics

```typescript
async function handleStripeWebhook(event) {
  // 1. Critical business logic FIRST
  await grantCredits(userId, amount);

  // 2. Analytics AFTER (non-blocking queue)
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

**Critical:** Never `await` trackServerEvent. Never use direct PostHog calls in webhooks.

## Quick Reference

### Imports
| Context | Import |
|---------|--------|
| Client-side | `import { trackEvent, identifyUser, resetUser } from '@/lib/analytics'` |
| Server-side | `import { trackServerEvent } from '@/lib/analytics/server'` |

### Property Naming
Always `snake_case`:
```typescript
// Correct
{ template_slug: 'hero', has_source_image: true, duration_ms: 1500 }

// Wrong
{ templateSlug: 'hero', hasSourceImage: true }
```

### Privacy Checklist
- [ ] Sensitive inputs have `data-private` attribute
- [ ] No PII in event properties (use IDs)
- [ ] IP addresses hashed
- [ ] User properties are immutable only

### Files
| File | Purpose |
|------|---------|
| `src/lib/analytics/events.ts` | Event schemas (Zod + TypeScript) |
| `src/lib/analytics/client.ts` | Browser tracking |
| `src/lib/analytics/server.ts` | Server tracking with queue |
| `src/lib/analytics/config.ts` | Privacy configuration |

## Common Pitfalls

### Blocking Webhooks
```typescript
// WRONG - blocks if PostHog slow
posthog.capture({ ... });

// RIGHT - non-blocking queue
trackServerEvent(userId, { ... });
```

### Mutable User Properties
```typescript
// WRONG
identifyUser(id, { credit_balance: balance });

// RIGHT - track as event
trackEvent({ event: 'credits_consumed', properties: { amount, balance_after } });
```

### Duplicate Identification
```typescript
// WRONG - fires every rerender
useEffect(() => { identifyUser(user.id, ...); }, [user]);

// RIGHT - use ref guard
const identifiedRef = useRef(false);
useEffect(() => {
  if (user && !identifiedRef.current) {
    identifyUser(user.id, ...);
    identifiedRef.current = true;
  }
}, [user]);
```

### Missing Zod Schema
```typescript
// WRONG - TypeScript only
export type NewEvent = { event: 'new'; properties: { foo: string } };

// RIGHT - Zod + TypeScript
export const newEventSchema = z.object({
  event: z.literal('new'),
  properties: z.object({ foo: z.string() }),
});
export type NewEvent = z.infer<typeof newEventSchema>;
```

## Debugging

### Events Not Appearing
1. Check `window.posthog` exists in console
2. Check Network tab for PostHog requests
3. Check console for Zod validation errors
4. Verify `NEXT_PUBLIC_POSTHOG_KEY` is set

### Session Replays Show Sensitive Data
1. Add `data-private` to sensitive inputs
2. Run `bun run check-privacy`
3. Verify masking in test recording

### Server Queue Not Flushing
1. Check `POSTHOG_API_KEY` is set
2. Check queue isn't at max (1000)
3. Check logs for queue errors

## Environment Variables

```env
# Client-side (public)
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.posthog.com

# Server-side
POSTHOG_API_KEY=phc_xxx
```

## Full Documentation

See `docs/posthog-implementation-guide.md` for:
- Complete architectural decision rationale
- Full privacy & compliance checklist
- Detailed testing requirements
- Performance considerations
- Source map setup with Vercel
