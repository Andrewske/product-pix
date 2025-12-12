# Implement Centralized Logging System

## Overview
Replace scattered `console.error` calls with a centralized logging system per project standards in CLAUDE.md: "No scattered console logs - use centralized logging".

## Architecture Decisions
- **Simple Logger Interface**: Start with structured console logging, easy to extend to external services later
- **Contextual Information**: Include timestamps and optional context objects
- **Type Safety**: Full TypeScript support with proper typing
- **Barrel Export**: Export from `@/lib/logging` for easy imports

## Implementation Tasks

### Phase 1: Create Logging Infrastructure
- [ ] Create centralized logger module
  - Files: `src/lib/logging/index.ts` (new)
  - Implementation:
    ```typescript
    interface LogContext {
      [key: string]: unknown;
    }

    export const logger = {
      error: (message: string, error?: unknown, context?: LogContext): void => {
        console.error(message, {
          error,
          context,
          timestamp: new Date().toISOString(),
        });
      },

      warn: (message: string, context?: LogContext): void => {
        console.warn(message, {
          context,
          timestamp: new Date().toISOString(),
        });
      },

      info: (message: string, context?: LogContext): void => {
        console.info(message, {
          context,
          timestamp: new Date().toISOString(),
        });
      },

      debug: (message: string, context?: LogContext): void => {
        if (process.env.NODE_ENV === 'development') {
          console.debug(message, {
            context,
            timestamp: new Date().toISOString(),
          });
        }
      },
    };
    ```
  - Tests: `src/lib/logging/__tests__/index.test.ts` (new)
  - Acceptance: Logger exports all methods with correct types

### Phase 2: Update Middleware
- [ ] Replace console.error in middleware
  - Files: `src/middleware.ts` (modify - line 39)
  - Change:
    ```typescript
    import { logger } from '@/lib/logging';

    // Line 39: Replace console.error
    logger.error('Admin middleware error', error, {
      pathname: request.nextUrl.pathname,
    });
    ```
  - Tests: `bun test src/__tests__/middleware.test.ts`
  - Acceptance: Middleware logs errors with structured format

### Phase 3: Update Refund Approval Queue Component
- [ ] Replace console.error calls in RefundApprovalQueue
  - Files: `src/components/admin/refund-approval-queue.tsx` (modify - lines 32, 63)
  - Change:
    ```typescript
    import { logger } from '@/lib/logging';

    // Line 32
    logger.error('Error fetching pending requests', error);

    // Line 63
    logger.error('Error approving refund', error, {
      refundId,
    });
    ```
  - Tests: `bun test src/components/admin/__tests__/refund-approval-queue.test.tsx`
  - Acceptance: Component uses centralized logger

### Phase 4: Create Logger Tests
- [ ] Add comprehensive logger tests
  - Files: `src/lib/logging/__tests__/index.test.ts` (new)
  - Tests:
    ```typescript
    import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
    import { logger } from '../index';

    describe('logger', () => {
      let consoleErrorSpy: ReturnType<typeof mock>;
      let consoleWarnSpy: ReturnType<typeof mock>;
      let consoleInfoSpy: ReturnType<typeof mock>;
      let consoleDebugSpy: ReturnType<typeof mock>;

      beforeEach(() => {
        consoleErrorSpy = mock(() => {});
        consoleWarnSpy = mock(() => {});
        consoleInfoSpy = mock(() => {});
        consoleDebugSpy = mock(() => {});

        console.error = consoleErrorSpy;
        console.warn = consoleWarnSpy;
        console.info = consoleInfoSpy;
        console.debug = consoleDebugSpy;
      });

      afterEach(() => {
        consoleErrorSpy.mockRestore();
        consoleWarnSpy.mockRestore();
        consoleInfoSpy.mockRestore();
        consoleDebugSpy.mockRestore();
      });

      it('logs errors with timestamp', () => {
        logger.error('Test error');
        expect(consoleErrorSpy).toHaveBeenCalledWith('Test error', expect.objectContaining({
          timestamp: expect.any(String),
        }));
      });

      it('logs errors with context', () => {
        const error = new Error('Test');
        logger.error('Test error', error, { userId: '123' });
        expect(consoleErrorSpy).toHaveBeenCalledWith('Test error', expect.objectContaining({
          error,
          context: { userId: '123' },
          timestamp: expect.any(String),
        }));
      });

      // Add tests for warn, info, debug
    });
    ```
  - Acceptance: All logger methods tested, 100% coverage

## Acceptance Criteria
- [ ] Centralized logger created at `src/lib/logging/index.ts`
- [ ] Logger has error, warn, info, debug methods
- [ ] All log calls include timestamps
- [ ] Optional context parameter supported
- [ ] All console.error calls replaced with logger.error
- [ ] Logger tests have 100% coverage
- [ ] All existing tests pass
- [ ] TypeScript compiles without errors

## Files to Create/Modify

### New Files (2)
- `src/lib/logging/index.ts` - Centralized logger
- `src/lib/logging/__tests__/index.test.ts` - Logger tests

### Modified Files (2)
- `src/middleware.ts` - Replace console.error with logger
- `src/components/admin/refund-approval-queue.tsx` - Replace console.error with logger

## Dependencies
- None - standalone infrastructure

## Testing Strategy
1. **Unit Tests**:
   ```bash
   bun test src/lib/logging/__tests__/index.test.ts
   ```
   Verify logger behavior

2. **Integration Tests**:
   ```bash
   bun test src/__tests__/middleware.test.ts
   bun test src/components/admin/__tests__/refund-approval-queue.test.tsx
   ```
   Verify components use logger correctly

3. **Manual Verification**:
   - Trigger an error in admin dashboard
   - Check console output includes timestamp and structured format

## Notes
- Future: Can extend to send logs to external service (Sentry, DataDog, etc.)
- Debug logs only in development mode
- Structured logging makes debugging easier in production
