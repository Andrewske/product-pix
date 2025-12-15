# Documentation, Testing, and Monitoring

## Files to Modify/Create
- `docs/analytics-guide.md` (new)
- `CLAUDE.md` (modify)
- `docs/posthog-testing-checklist.md` (new)

## Implementation Details

### Task 6.1: Create Analytics Development Guide

Create `docs/analytics-guide.md`:

**Sections:**
1. **Event Catalog** - List all 17 events with property examples
2. **How to Add New Events** - 3-step process:
   - Define type + Zod schema in events.ts
   - Implement tracking in component/API
   - Add tests
3. **A/B Testing Integration** - How custom A/B testing works with PostHog analytics
4. **User Properties** - Only immutable fields (email, tier, created_at)
5. **Best Practices**:
   - Use snake_case for all properties
   - Validate with Zod schemas
   - Wrap in try-catch
   - Server-side: use queue for webhooks

### Task 6.2: Update CLAUDE.md with Analytics Patterns

Modify `CLAUDE.md`:

**Add Section: "Analytics & Tracking"**

**Content:**
- Quick reference for trackEvent/trackServerEvent
- Event queue pattern for webhooks (prevents blocking critical paths)
- Link to analytics-guide.md
- Environment variables required:
  - NEXT_PUBLIC_POSTHOG_KEY
  - NEXT_PUBLIC_POSTHOG_HOST
  - POSTHOG_API_KEY
- Privacy-first principles (masking, identified users only)

**Example:**
```markdown
## Analytics & Tracking

**Client-side:**
```typescript
import { trackEvent } from '@/lib/analytics';

trackEvent({
  event: 'generation_started',
  properties: { template_slug, aspect_ratio }
});
```

**Server-side (webhooks):**
```typescript
import { trackServerEvent } from '@/lib/analytics/server';

// Non-blocking queue
trackServerEvent(userId, {
  event: 'credits_purchased',
  properties: { pack_id, credits }
});
```

See `docs/analytics-guide.md` for full documentation.
```

### Task 6.3: Create Comprehensive Test Suite

**Verify test coverage targets:**
```bash
bun test --coverage
```

**Requirements:**
- 100% coverage for: trackEvent, identifyUser, resetUser, trackServerEvent, identifyUserServer
- 75%+ coverage for analytics module overall

**Create missing tests if needed**

### Task 6.4: Manual Testing Checklist

Create `docs/posthog-testing-checklist.md`:

**Checklist Items:**
- [ ] PostHog initializes in browser console
- [ ] User identified after login (check PostHog Live Events)
- [ ] Pageviews tracked on navigation
- [ ] Generation events tracked with snake_case properties
- [ ] Batch events tracked
- [ ] Payment events tracked (webhook test)
- [ ] Rate limit events include user context
- [ ] Session replays appear in PostHog with masking
- [ ] URL parameters masked in replays
- [ ] A/B test exposure tracked
- [ ] Source maps show file names in errors (after deploy)
- [ ] Billing alert set at 80% usage in PostHog dashboard

### Task 6.5: Set Up PostHog Monitoring

**PostHog Dashboard Setup:**

1. **Billing Alert**
   - Go to PostHog Settings → Billing
   - Set alert at 80% of monthly event limit
   - Add email notification

2. **Session Replay Sampling**
   - Go to Settings → Session Recording
   - Set sampling rate: 10% initially
   - Increase after privacy review confirms masking works

3. **Data Retention**
   - Configure: 90 days for events
   - Configure: 30 days for replays

## Acceptance Criteria
- Analytics guide is clear and actionable
- CLAUDE.md reflects new analytics infrastructure
- Test coverage targets met (100% core, 75% overall)
- Manual testing checklist created
- All checklist items pass in staging
- PostHog monitoring configured:
  - Billing alert at 80%
  - Replay sampling at 10%
  - Retention configured

## Tests Required
- Run `bun test --coverage`
- Verify coverage meets targets
- Execute manual testing checklist
- Document results

## Dependencies
- All previous tasks must be complete
- Staging environment deployment for manual testing
- PostHog dashboard access for monitoring setup
