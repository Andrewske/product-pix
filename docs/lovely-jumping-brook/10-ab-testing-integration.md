# A/B Testing Integration (Keep Custom Implementation)

## Files to Modify/Create
- `src/lib/ab-testing.ts` (modify)
- `src/lib/__tests__/ab-testing.test.ts` (modify)
- `docs/ab-testing-analytics.md` (new)

## Implementation Details

### Task 4.1: Update A/B Testing to Track Exposure in PostHog

Modify `src/lib/ab-testing.ts`:

**Changes:**
- Import `trackEvent` from '@/lib/analytics'
- Update `trackABTestEvent()` to call PostHog
- **Keep existing `getABTestVariant()` logic** (hash-based, localStorage)
- **Keep AB_TESTS config** (LANDING_HERO, PRICING_DISPLAY)

**Implementation:**
```typescript
import { trackEvent } from '@/lib/analytics';

export function trackABTestEvent(
  testName: string,
  variant: ABTestVariant,
  event: string,
  userId?: string
): void {
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

**Key Point:**
Custom A/B testing stays unchanged - we're only adding PostHog tracking for analytics. Variant assignment still uses localStorage for guaranteed persistence.

### Task 4.2: Document A/B Testing Analytics Pattern

Create `docs/ab-testing-analytics.md`:

**Content:**
- How custom A/B testing works (localStorage-based)
- How to track conversion events with variant metadata
- How to analyze experiments in PostHog (filter by ab_test_exposure.variant)
- Example funnel query

**Example Query Pattern:**
```
Filter users where:
  ab_test_exposure.test_name = 'landing_hero' AND
  ab_test_exposure.variant = 'B'

Then analyze conversion rate:
  credits_purchased events / unique users
```

## Acceptance Criteria
- Custom A/B testing logic unchanged
- Variant assignment still uses localStorage
- Exposure tracked in PostHog as events
- Variants persist across sessions
- Documentation explains analysis pattern

## Tests Required

Update `src/lib/__tests__/ab-testing.test.ts`:
- Test: getABTestVariant returns consistent variants
- Test: trackABTestEvent calls trackEvent with correct properties
- Test: Variant persists in localStorage

## Dependencies
- Task 06 (core app integration) must be complete
