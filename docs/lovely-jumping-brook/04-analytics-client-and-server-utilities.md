# Analytics Client and Server Utilities

## Files to Modify/Create
- `src/lib/analytics/client.ts` (new)
- `src/lib/analytics/server.ts` (new)
- `src/lib/analytics/index.ts` (new)
- `src/lib/analytics/__tests__/client.test.ts` (new)
- `src/lib/analytics/__tests__/server.test.ts` (new)

## Implementation Details

### Task 1.8: Create Client-Side Analytics Utilities

Create `src/lib/analytics/client.ts` with type-safe event tracking:

**Exports:**
- `trackEvent<T>(event: T): void` - Validates with Zod, tracks to PostHog
- `identifyUser(userId: string, properties?): void` - Guard with useRef to prevent duplicates
- `resetUser(): void`
- `isUserIdentified(): boolean`

**Implementation Notes:**
- Validate events with Zod schemas before tracking
- Reject invalid events with helpful error messages
- Use PostHog client from provider context

### Task 1.9: Create Server-Side Analytics with Event Queue

Create `src/lib/analytics/server.ts` with in-memory queue pattern:

**Implementation:**
- In-memory event queue (array)
- Background worker (setInterval 10s) flushes queue to PostHog
- `trackServerEvent<T>(userId: string, event: T): void` - Pushes to queue (never throws)
- `identifyUserServer(userId: string, properties?): void`
- Queue management (max 1000 events, FIFO overflow)

**Features:**
- Validates events with Zod schemas
- Catches and logs errors (don't throw)
- Worker handles PostHog errors independently
- Graceful shutdown (flush queue on SIGTERM)

**Why Queue Pattern:**
Critical for webhooks - completely decouples analytics from payment processing.

### Task 1.10: Create Analytics Barrel Export

Create `src/lib/analytics/index.ts`:

**Exports:**
- Re-export PostHogProvider
- Re-export client functions (trackEvent, identifyUser, resetUser)
- Re-export server functions (trackServerEvent, identifyUserServer)
- Re-export event types

## Acceptance Criteria
- Type-safe API works correctly
- Validation rejects invalid events
- Client functions have 100% test coverage
- Server functions have 100% test coverage
- Queue is non-blocking
- Queue handles overflow (FIFO discard)
- Errors logged but not thrown
- All analytics code accessed through @/lib/analytics

## Tests Required

### `src/lib/analytics/__tests__/client.test.ts`:
- Test: trackEvent validates schema before capturing
- Test: trackEvent rejects invalid events
- Test: identifyUser calls posthog.identify
- Test: resetUser calls posthog.reset
- Coverage: 100% for core tracking functions

### `src/lib/analytics/__tests__/server.test.ts`:
- Test: trackServerEvent adds to queue without blocking
- Test: Worker flushes queue to PostHog
- Test: Queue overflow discards oldest events
- Test: Errors logged but not thrown
- Test: Invalid events rejected by Zod schema
- Coverage: 100% for core tracking functions

## Dependencies
- Task 03 (PostHog config/providers) must be complete
