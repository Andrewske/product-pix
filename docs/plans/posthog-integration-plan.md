# PostHog Analytics Integration Implementation Plan

## Overview

Integrate PostHog Cloud (US) for comprehensive analytics, error tracking, session replay, and A/B testing in ProductPix. Replace custom A/B testing framework with PostHog Feature Flags while maintaining privacy-first approach with sensitive data masking.

**Scope**: Web analytics, product analytics, session replay, error tracking
**Timeline**: 8-12 hours
**Target Coverage**: ≥75%

---

## Architecture Decisions

### Decision 1: Client + Server SDK Pattern
**Rationale**: Use posthog-js for browser events and posthog-node for server-side events (Stripe webhooks, API tracking). This ensures complete coverage across all user touchpoints.

### Decision 2: Type-Safe Event Catalog
**Rationale**: Centralized event definitions in `src/lib/analytics/events.ts` with TypeScript discriminated unions prevent typos and ensure consistent event properties across codebase.

### Decision 3: Privacy-First Session Replay
**Rationale**: Configure `maskAllInputs: true` and `person_profiles: 'identified_only'` to minimize PII collection and comply with privacy best practices. Only track authenticated users.

### Decision 4: PostHog Feature Flags for A/B Testing
**Rationale**: Migrate from custom localStorage-based A/B testing to PostHog feature flags for unified analytics platform, better experiment analysis, and reduced maintenance.

### Decision 5: Lazy PostHog Initialization
**Rationale**: Initialize PostHog client only on first property access (server-side) to avoid blocking app startup and handle graceful degradation if PostHog is unreachable.

---

## Implementation Tasks

### Phase 1: Foundation & Infrastructure

#### Task 1.1: Install Dependencies
- [ ] Install PostHog SDKs
  - Command: `bun add posthog-js posthog-node`
  - Acceptance: Dependencies listed in package.json with latest stable versions

#### Task 1.2: Environment Configuration
- [ ] Add PostHog environment variables to env schema
  - Files: `src/lib/env.ts` (modify)
  - Changes:
    ```typescript
    // Add to envSchema object
    NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().url().default('https://us.posthog.com'),
    POSTHOG_PERSONAL_API_KEY: z.string().min(1).optional(),
    POSTHOG_PROJECT_ID: z.string().optional(),
    ```
  - Tests: Verify env validation passes with PostHog vars
  - Acceptance: TypeScript types include new env vars, validation works

#### Task 1.3: Create Event Type Definitions
- [ ] Define centralized event catalog
  - Files: `src/lib/analytics/events.ts` (new)
  - Content: TypeScript discriminated union type for all analytics events
  - Events to include:
    - Auth: user_signed_up, user_logged_in, user_logged_out
    - Generation: generation_started, generation_completed, generation_failed, image_downloaded
    - Batch: batch_created, batch_completed, batch_cancelled
    - Credits: credits_purchased, subscription_started, subscription_cancelled, insufficient_credits
    - Navigation: pricing_viewed, dashboard_viewed, template_selected
    - Errors: error_occurred, rate_limit_hit
  - Tests: `src/lib/analytics/__tests__/events.test.ts` - Type tests for event properties
  - Acceptance: All event types compile without errors, discriminated union works

#### Task 1.4: Create Client-Side PostHog Provider
- [ ] Implement PostHog React provider with Next.js integration
  - Files: `src/lib/analytics/posthog-provider.tsx` (new)
  - Features:
    - Initialize PostHog with privacy-first config
    - Auto-capture pageviews on route changes
    - Session replay with masking (maskAllInputs: true, maskTextSelector: '[data-private]')
    - Debug mode in development
  - Dependencies: Next.js usePathname, useSearchParams hooks
  - Tests: `src/lib/analytics/__tests__/posthog-provider.test.tsx`
    - Test: PostHog initializes with correct config
    - Test: Pageview captured on route change
    - Test: Debug mode enabled in dev
  - Acceptance: Provider wraps app without errors, pageviews tracked

#### Task 1.5: Create Server-Side PostHog Client
- [ ] Implement singleton PostHog Node client
  - Files: `src/lib/analytics/posthog-server.ts` (new)
  - Features:
    - Lazy initialization (only create client when first accessed)
    - Graceful error handling if API key missing
    - Shutdown handler for cleanup
  - Tests: `src/lib/analytics/__tests__/posthog-server.test.ts`
    - Test: Client initializes on first call
    - Test: Returns same instance on subsequent calls
    - Test: Throws error if API key missing
    - Test: Shutdown closes client
  - Acceptance: Singleton pattern works, graceful degradation

#### Task 1.6: Create Client-Side Analytics Utilities
- [ ] Implement type-safe event tracking helpers
  - Files: `src/lib/analytics/index.ts` (new)
  - Exports:
    - `trackEvent<T>(event: T, properties: EventProperties<T>): void`
    - `identifyUser(userId: string, properties?): void`
    - `resetUser(): void`
    - `isUserIdentified(): boolean`
    - Re-export PostHogProvider
  - Tests: `src/lib/analytics/__tests__/index.test.ts`
    - Test: trackEvent calls posthog.capture with correct args
    - Test: identifyUser calls posthog.identify
    - Test: resetUser calls posthog.reset
    - Test: isUserIdentified checks distinct_id vs session_id
  - Acceptance: Type-safe API, all functions work as expected

#### Task 1.7: Create Server-Side Analytics Utilities
- [ ] Implement server-side event tracking helpers
  - Files: `src/lib/analytics/server-events.ts` (new)
  - Exports:
    - `trackServerEvent<T>(userId: string, event: T, properties): void`
    - `identifyUserServer(userId: string, properties?): void`
  - Features:
    - Use PostHog server client
    - Catch and log errors (don't throw)
  - Tests: `src/lib/analytics/__tests__/server-events.test.ts`
    - Test: trackServerEvent captures with distinctId
    - Test: identifyUserServer identifies user
    - Test: Errors logged but not thrown
  - Acceptance: Server-side tracking works, errors handled gracefully

---

### Phase 2: Core Integration Points

#### Task 2.1: Integrate PostHog Provider in Root Layout
- [ ] Add PostHogProvider to app layout
  - Files: `src/app/layout.tsx` (modify)
  - Changes: Import PostHogProvider, wrap body content (outside ThemeProvider)
  - Acceptance: App renders without errors, PostHog initializes in browser

#### Task 2.2: Add User Identification to Auth Hooks
- [ ] Identify users on login, reset on logout
  - Files: `src/lib/auth/hooks.ts` (modify)
  - Changes in `useUserProfile()`:
    - Import `identifyUser`, `resetUser` from '@/lib/analytics'
    - Call `resetUser()` when user is null
    - Call `identifyUser(user.id, { email, creditBalance, tier, createdAt })` when profile loads
  - Tests: `src/lib/auth/__tests__/hooks.test.ts`
    - Test: identifyUser called when profile loads
    - Test: resetUser called on logout
    - Test: User properties match profile data
  - Acceptance: Users identified on login, identity cleared on logout

#### Task 2.3: Add Error Tracking to Global Error Boundary
- [ ] Track errors in error boundary
  - Files: `src/app/error.tsx` (modify)
  - Changes:
    - Import `useEffect` from react
    - Import `trackEvent` from '@/lib/analytics'
    - Add useEffect to track 'error_occurred' event with error message, page, digest
  - Tests: Manual test (trigger error, check PostHog)
  - Acceptance: Errors tracked with full context

---

### Phase 3: Product Event Tracking

#### Task 3.1: Track Generation Flow Events
- [ ] Add analytics to image generation flow
  - Files: `src/app/generate/page.tsx` (modify)
  - Events to add:
    - `generation_started` - Before API call (templateSlug, aspectRatio, resolution, hasSourceImage)
    - `generation_completed` - On success (jobId, templateSlug, duration_ms)
    - `generation_failed` - On error (error, templateSlug)
    - `insufficient_credits` - On 402 response (required, balance)
    - `image_downloaded` - On download button click (jobId, imageUrl)
  - Tests: `src/app/generate/__tests__/page.test.tsx`
    - Test: generation_started fired on submit
    - Test: generation_completed fired on success
    - Test: generation_failed fired on error
    - Test: insufficient_credits fired on 402
    - Test: image_downloaded fired on download
  - Acceptance: All generation events tracked with correct properties

#### Task 3.2: Track Batch Creation Events
- [ ] Add analytics to batch creation flow
  - Files: `src/app/batch/new/page.tsx` (modify)
  - Events to add:
    - `batch_created` - After successful creation (batchId, itemCount, totalCredits)
    - `insufficient_credits` - When credits < totalCredits (required, balance)
  - Tests: `src/app/batch/new/__tests__/page.test.tsx`
    - Test: batch_created fired on success
    - Test: insufficient_credits fired when credits low
  - Acceptance: Batch creation events tracked

#### Task 3.3: Track Batch Completion Events
- [ ] Add analytics to batch detail page
  - Files: `src/app/batch/[batchId]/page.tsx` (modify)
  - Events to add:
    - `batch_completed` - When status changes to 'completed' (batchId, successCount, failedCount, duration_ms)
    - `batch_cancelled` - When user cancels batch (batchId)
  - Tests: `src/app/batch/[batchId]/__tests__/page.test.tsx`
    - Test: batch_completed fired when status becomes 'completed'
    - Test: batch_cancelled fired on cancel
  - Acceptance: Batch lifecycle events tracked

#### Task 3.4: Track Credit Purchase Events (Server-Side)
- [ ] Add server-side tracking to Stripe webhooks
  - Files: `src/lib/stripe/webhook-handlers.ts` (modify) OR `src/app/api/webhooks/stripe/route.ts`
  - Events to add:
    - `credits_purchased` - On payment_intent.succeeded (packId, credits, amountCents, paymentIntentId)
    - `subscription_started` - On subscription activated (tier, credits)
    - `subscription_cancelled` - On subscription canceled (tier)
  - Import: `trackServerEvent` from '@/lib/analytics/server-events'
  - Tests: `src/lib/stripe/__tests__/webhook-handlers.test.ts`
    - Test: credits_purchased tracked on payment success
    - Test: subscription_started tracked on activation
    - Test: subscription_cancelled tracked on cancel
  - Acceptance: Payment events tracked server-side

#### Task 3.5: Track Rate Limit Events
- [ ] Add rate limit hit tracking
  - Files: `src/app/api/generate/route.ts` (modify), other rate-limited endpoints
  - Event: `rate_limit_hit` - When rate limit exceeded (endpoint, retryAfter)
  - Import: `trackServerEvent` from '@/lib/analytics/server-events'
  - Tests: `src/app/api/generate/__tests__/route.test.ts`
    - Test: rate_limit_hit tracked when rate limit exceeded
  - Acceptance: Rate limit hits tracked

---

### Phase 4: A/B Testing Migration

#### Task 4.1: Replace A/B Testing Implementation with Feature Flags
- [ ] Migrate custom A/B testing to PostHog
  - Files: `src/lib/ab-testing.ts` (modify)
  - Changes:
    - Remove custom hash-based variant assignment
    - Remove getSessionId() function
    - Replace getABTestVariant() to use posthog.getFeatureFlag()
    - Map flag values ('control'/'test') to ABTestVariant ('A'/'B')
    - Update trackABTestEvent() to use posthog.capture with ab_test metadata
    - Keep AB_TESTS config (LANDING_HERO, PRICING_DISPLAY) for reference
  - Tests: `src/lib/__tests__/ab-testing.test.ts`
    - Test: getABTestVariant returns 'A' for 'control' flag
    - Test: getABTestVariant returns 'B' for 'test' flag
    - Test: Returns 'A' when flag not found
    - Test: trackABTestEvent captures with correct metadata
  - Acceptance: A/B testing uses PostHog feature flags

#### Task 4.2: Document Feature Flag Setup
- [ ] Create PostHog feature flag setup instructions
  - Files: `docs/posthog-feature-flags-setup.md` (new)
  - Content:
    - Step-by-step instructions for creating flags in PostHog dashboard
    - Flag configurations: `landing_hero` (50/50), `pricing_display` (70/30)
    - Variant naming: 'control' = A, 'test' = B
    - Release conditions: 100% of users
  - Acceptance: Clear instructions for manual setup

---

### Phase 5: Session Replay Privacy & Source Maps

#### Task 5.1: Add Privacy Attributes to Sensitive UI Elements
- [ ] Add data-private attribute to sensitive fields
  - Files: Search codebase for sensitive inputs (email, credit card, passwords)
  - Changes: Add `data-private` attribute to:
    - Email inputs
    - Password inputs
    - Credit card fields (if any client-side)
    - Any PII fields
  - Tests: Manual review - check session replays mask these fields
  - Acceptance: Sensitive data masked in session replays

#### Task 5.2: Enable Production Source Maps
- [ ] Configure Next.js for source map generation
  - Files: `next.config.mjs` (modify)
  - Changes: Add `productionBrowserSourceMaps: true` to nextConfig
  - Acceptance: Source maps generated in production build

#### Task 5.3: Create Source Map Upload Script
- [ ] Implement PostHog source map upload
  - Files: `scripts/upload-sourcemaps.sh` (new)
  - Content:
    ```bash
    #!/bin/bash
    if [ -z "$POSTHOG_PERSONAL_API_KEY" ] || [ -z "$VERCEL_GIT_COMMIT_SHA" ]; then
      echo "Skipping source map upload"
      exit 0
    fi
    bun add -g posthog-cli
    posthog sourcemaps upload \
      --project-id="$POSTHOG_PROJECT_ID" \
      --api-key="$POSTHOG_PERSONAL_API_KEY" \
      --app-version="$VERCEL_GIT_COMMIT_SHA" \
      --source-map-dir=".next" \
      --source-url-prefix="https://productpix.app/_next"
    ```
  - Make executable: `chmod +x scripts/upload-sourcemaps.sh`
  - Acceptance: Script runs without errors in CI/CD

#### Task 5.4: Update Build Process
- [ ] Integrate source map upload into Vercel build
  - Files: Vercel project settings (manual), or `package.json` scripts
  - Changes: Update build command to `bun run build && ./scripts/upload-sourcemaps.sh`
  - Acceptance: Source maps uploaded on Vercel deployment

---

### Phase 6: Documentation & Testing

#### Task 6.1: Create Analytics Development Guide
- [ ] Document how to add new events
  - Files: `docs/analytics-guide.md` (new)
  - Sections:
    - Event catalog (list all events with examples)
    - How to add new events (3-step process)
    - How to use feature flags
    - How to update user properties
    - Best practices
  - Acceptance: Clear, actionable guide for developers

#### Task 6.2: Update CLAUDE.md with Analytics Patterns
- [ ] Add PostHog section to project docs
  - Files: `CLAUDE.md` (modify)
  - Section: "Analytics & Tracking"
  - Content:
    - Quick reference for trackEvent/trackServerEvent
    - Link to analytics-guide.md
    - Environment variables required
  - Acceptance: CLAUDE.md reflects new analytics infrastructure

#### Task 6.3: Create Integration Test Suite
- [ ] Test full analytics flow end-to-end
  - Files: `src/lib/analytics/__tests__/integration.test.ts` (new)
  - Tests:
    - Test: PostHog provider initializes
    - Test: User identification works
    - Test: Events captured with correct properties
    - Test: Feature flags return variants
    - Test: Session replay configured correctly
  - Acceptance: Integration tests pass, ≥75% coverage

#### Task 6.4: Manual Testing Checklist
- [ ] Create manual QA checklist
  - Files: `docs/posthog-testing-checklist.md` (new)
  - Checklist items:
    - [ ] PostHog initializes in browser console
    - [ ] User identified after login (check PostHog Live Events)
    - [ ] Pageviews tracked on navigation
    - [ ] Generation events tracked
    - [ ] Batch events tracked
    - [ ] Payment events tracked
    - [ ] Errors tracked in error boundary
    - [ ] Session replays appear in PostHog
    - [ ] Feature flags return expected variants
    - [ ] Source maps show file names in errors
  - Acceptance: All items pass in staging environment

---

## Acceptance Criteria

### Functional Requirements
- [ ] All events defined in event catalog are tracked
- [ ] Users identified on login, reset on logout
- [ ] Errors captured with full context (message, page, digest)
- [ ] Session replays mask sensitive data (inputs, data-private elements)
- [ ] Feature flags work for A/B tests (LANDING_HERO, PRICING_DISPLAY)
- [ ] Server-side events tracked for payments and webhooks
- [ ] Source maps uploaded for production error tracking

### Technical Requirements
- [ ] All tests pass (`bun test`)
- [ ] No TypeScript errors (`bun run build`)
- [ ] Test coverage ≥75% for analytics module
- [ ] No console errors in browser
- [ ] PostHog requests visible in Network tab
- [ ] Events appear in PostHog Live Events dashboard

### Privacy & Compliance
- [ ] Only identified users tracked (person_profiles: 'identified_only')
- [ ] All input fields masked in session replay
- [ ] Elements with data-private attribute masked
- [ ] No PII in event properties (use IDs, not emails/names)

### Performance
- [ ] PostHog initialization doesn't block app render
- [ ] Event tracking doesn't impact user experience
- [ ] Server-side tracking errors logged but not thrown

---

## Files to Create

### Analytics Infrastructure (7 files)
1. `src/lib/analytics/events.ts` - Event type definitions
2. `src/lib/analytics/posthog-provider.tsx` - Client provider
3. `src/lib/analytics/posthog-server.ts` - Server client
4. `src/lib/analytics/index.ts` - Client utilities
5. `src/lib/analytics/server-events.ts` - Server utilities
6. `scripts/upload-sourcemaps.sh` - Source map upload script
7. `src/lib/analytics/__tests__/` - Test files (5 test files)

### Documentation (3 files)
8. `docs/analytics-guide.md` - Developer guide
9. `docs/posthog-feature-flags-setup.md` - Feature flag setup
10. `docs/posthog-testing-checklist.md` - QA checklist

---

## Files to Modify

### Configuration (2 files)
1. `src/lib/env.ts` - Add PostHog env vars to schema
2. `next.config.mjs` - Enable production source maps

### Core Integration (3 files)
3. `src/app/layout.tsx` - Add PostHogProvider
4. `src/lib/auth/hooks.ts` - User identification
5. `src/app/error.tsx` - Error tracking

### Event Tracking (6 files)
6. `src/app/generate/page.tsx` - Generation events
7. `src/app/batch/new/page.tsx` - Batch creation events
8. `src/app/batch/[batchId]/page.tsx` - Batch completion events
9. `src/lib/stripe/webhook-handlers.ts` - Payment events
10. `src/app/api/generate/route.ts` - Rate limit tracking
11. `src/lib/ab-testing.ts` - Feature flag integration

### Documentation (1 file)
12. `CLAUDE.md` - Add analytics section

**Total: 10 new files + 12 modified files**

---

## Dependencies

### External Dependencies
- `posthog-js@^1.0.0` - Browser SDK
- `posthog-node@^4.0.0` - Server SDK
- `posthog-cli` (global) - Source map uploads

### Internal Dependencies
- Task 1.3 (events.ts) must complete before 1.6, 1.7 (utilities depend on event types)
- Task 1.4 (provider) must complete before 2.1 (layout integration)
- Task 1.5 (server client) must complete before 1.7 (server utilities)
- Phase 1 must complete before Phase 2 (infrastructure before integration)
- Phase 2 must complete before Phase 3 (core integration before event tracking)
- Task 5.2 must complete before 5.3 (source maps before upload)

### Environment Variables Required
- `NEXT_PUBLIC_POSTHOG_KEY` - PostHog project API key (required)
- `NEXT_PUBLIC_POSTHOG_HOST` - PostHog host URL (default: https://us.posthog.com)
- `POSTHOG_PERSONAL_API_KEY` - Personal API key for server-side (optional in dev)
- `POSTHOG_PROJECT_ID` - Project ID for source maps (optional)
- `VERCEL_GIT_COMMIT_SHA` - Git commit SHA (auto-set by Vercel)

### Manual Setup Required
1. Create PostHog Cloud account (https://posthog.com)
2. Create new project in PostHog dashboard
3. Copy API keys to environment variables
4. Create feature flags in PostHog dashboard (see docs/posthog-feature-flags-setup.md)
5. Update Vercel build command: `bun run build && ./scripts/upload-sourcemaps.sh`

---

## Risk Mitigation

### Risk: PostHog API unreachable
**Mitigation**: All tracking wrapped in try-catch, errors logged but not thrown. App continues to function.

### Risk: Session replay captures PII
**Mitigation**: Configure `maskAllInputs: true`, add `data-private` to sensitive fields, review recordings before enabling 100% sampling.

### Risk: Source map upload fails in CI/CD
**Mitigation**: Script checks for required env vars, exits gracefully if missing. Build succeeds even if upload fails.

### Risk: Event schema drift
**Mitigation**: Centralized event definitions with TypeScript types enforce schema at compile time.

### Risk: Performance impact from analytics
**Mitigation**: PostHog batches events, lazy initialization, async tracking. Monitor Core Web Vitals.

---

## Success Metrics

- **Coverage**: ≥75% test coverage for analytics module
- **Events**: All 17 event types tracked within 1 week
- **Adoption**: 100% of user flows instrumented
- **Errors**: Error tracking captures ≥95% of production errors
- **Privacy**: Zero PII leaks in session replays
- **Performance**: No degradation in page load times (<100ms overhead)

---

## Post-Implementation

### PostHog Dashboard Setup
1. Create dashboards:
   - User Funnel: Landing → Signup → First Generation
   - Generation Metrics: Success rate, duration, templates
   - Revenue: Credit purchases, subscriptions
   - Errors: Error rate by page
2. Set up alerts:
   - Error rate > 5% in 10-min window
   - Generation failure rate > 10%
   - Rate limit hits > 100/hour
3. Configure data retention (90 days for events, 30 days for replays)

### Team Training
1. Walk through PostHog dashboard
2. Demonstrate how to add new events
3. Show how to create feature flags
4. Review privacy settings and compliance

---

**Plan Status**: Ready for OpenCode orchestrator implementation
**Estimated Completion**: 8-12 hours
**Priority**: High (analytics foundational for product decisions)
