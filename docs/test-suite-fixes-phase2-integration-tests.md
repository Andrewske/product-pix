# Test Suite Fixes - Phase 2: Critical Integration Tests

## Overview
Add integration tests for critical business logic currently untested or over-mocked. These tests will catch database errors, API validation issues, and R2 storage problems before they reach production.

**Priority: HIGH** - These gaps represent production risk.

## Architecture Decisions

### Database Testing Strategy
- **Use test database instance**: Separate Supabase project or local setup
- **Transaction isolation**: Each test runs in a transaction that rolls back
- **RLS testing**: Verify Row Level Security policies work correctly
- **Seed data**: Minimal fixtures for each test

### API Route Testing Strategy
- **Real Request objects**: Use Web API `Request`/`Response`
- **Minimal mocking**: Only mock external services (Stripe, Gemini, R2)
- **Database integration**: Use real database for data operations
- **Auth middleware**: Test with real JWT tokens, not mocked auth

### Test Organization
- Integration tests in separate files: `*.integration.test.ts`
- Can be run separately: `bun test --name-pattern "integration"`
- Share test utilities in `src/__tests__/integration-utils.ts`

## Implementation Tasks

### Phase 2A: Database Integration Tests

#### Task 1: Create Integration Test Infrastructure
- [ ] Create integration test utilities
  - Files: `src/__tests__/integration-utils.ts` (new)
  - Exports:
    - `setupTestDatabase()` - Initialize test DB connection
    - `cleanupTestDatabase()` - Cleanup after tests
    - `createTestUser()` - Create authenticated test user
    - `withTransaction()` - Run test in transaction that rolls back
  - Tests: Self-test utilities work correctly
  - Acceptance: Utilities can be imported and used in other tests

#### Task 2: Batch Database Operations Tests
- [ ] Test batch creation with transactions
  - Files: `src/lib/db/__tests__/batch.integration.test.ts` (new)
  - Tests:
    - Create batch with valid data → returns batch ID
    - Create batch with invalid template ID → throws error
    - Create batch without user auth → throws error
    - Transaction rollback on failure (partial insert)
  - Acceptance: All batch creation paths tested

- [ ] Test batch status updates
  - Files: `src/lib/db/__tests__/batch.integration.test.ts` (modify)
  - Tests:
    - Update batch status from queued → processing
    - Update batch status from processing → completed
    - Update batch status from processing → failed
    - Invalid status transitions throw errors
  - Acceptance: Status state machine tested

- [ ] Test batch queries and filtering
  - Files: `src/lib/db/__tests__/batch.integration.test.ts` (modify)
  - Tests:
    - Get batches for specific user
    - Filter by status
    - Filter by template ID
    - Pagination works correctly
  - Acceptance: Query operations return correct results

#### Task 3: Credit Transaction Tests
- [ ] Test credit consumption
  - Files: `src/lib/db/__tests__/credits.integration.test.ts` (new)
  - Tests:
    - Consume credits reduces user balance
    - Insufficient credits throws error
    - Negative credit consumption throws error
    - Transaction atomicity (credit + job creation)
  - Acceptance: Credit operations are safe and atomic

- [ ] Test credit refunds
  - Files: `src/lib/db/__tests__/credits.integration.test.ts` (modify)
  - Tests:
    - Refund credits increases user balance
    - Refund creates transaction record
    - Cannot refund more than consumed
    - Refund idempotency (no double refunds)
  - Acceptance: Refund logic prevents user errors

#### Task 4: RLS Policy Tests
- [ ] Test Row Level Security policies
  - Files: `src/lib/db/__tests__/rls.integration.test.ts` (new)
  - Tests:
    - User can only read their own batches
    - User can only update their own batches
    - User cannot access other users' generated images
    - Admin user can access all records (if applicable)
  - Acceptance: RLS policies enforce data isolation

### Phase 2B: API Route Integration Tests

#### Task 5: Batch API Route Tests
- [ ] Test POST /api/batch - Success cases
  - Files: `src/app/api/batch/__tests__/route.integration.test.ts` (new)
  - Tests:
    - Valid batch creation returns 201 with batch ID
    - Batch is created in database
    - Jobs are queued for processing
    - Response includes correct job count
  - Acceptance: Happy path fully tested

- [ ] Test POST /api/batch - Validation errors
  - Files: `src/app/api/batch/__tests__/route.integration.test.ts` (modify)
  - Tests:
    - Missing template ID → 400 error
    - Invalid template ID → 400 error
    - Missing batch file → 400 error
    - Invalid JSON payload → 400 error
    - Each error has descriptive message
  - Acceptance: All validation paths return proper errors

- [ ] Test POST /api/batch - Auth errors
  - Files: `src/app/api/batch/__tests__/route.integration.test.ts` (modify)
  - Tests:
    - No auth token → 401 error
    - Invalid auth token → 401 error
    - Expired auth token → 401 error
  - Acceptance: Auth middleware properly enforced

- [ ] Test POST /api/batch - Business logic errors
  - Files: `src/app/api/batch/__tests__/route.integration.test.ts` (modify)
  - Tests:
    - Insufficient credits → 402 error (payment required)
    - Database constraint violation → 500 error
    - Template not found → 404 error
  - Acceptance: Error handling covers all failure modes

- [ ] Test GET /api/batch - List batches
  - Files: `src/app/api/batch/__tests__/route.integration.test.ts` (modify)
  - Tests:
    - Returns user's batches only
    - Pagination works correctly
    - Filtering by status works
    - Empty result for new user
  - Acceptance: List operations secure and functional

#### Task 6: Other Critical API Routes (if applicable)
- [ ] Identify other untested API routes
  - Files: Search `src/app/api/` for route handlers
  - Action: List all routes and their test coverage
  - Acceptance: Inventory of routes needing tests

- [ ] Add integration tests for top 3 critical routes
  - Files: `src/app/api/**/__tests__/*.integration.test.ts` (new)
  - Priority: Payment, job status, image generation
  - Acceptance: Critical paths tested

### Phase 2C: R2 Storage Integration Tests

#### Task 7: R2 Upload Integration Tests
- [ ] Test presigned URL generation
  - Files: `src/lib/r2/__tests__/integration.test.ts` (new)
  - Tests:
    - Generate presigned URL for valid file
    - URL includes correct bucket and key
    - URL expires after configured time
    - URL works for actual upload (optional, may need real R2)
  - Acceptance: Presigned URL generation tested

- [ ] Test upload error scenarios
  - Files: `src/lib/r2/__tests__/integration.test.ts` (modify)
  - Tests:
    - File too large → error
    - Invalid file type → error
    - Network timeout → error
    - CORS preflight failure → descriptive error
  - Acceptance: Error cases provide actionable messages

- [ ] Test image retrieval
  - Files: `src/lib/r2/__tests__/integration.test.ts` (modify)
  - Tests:
    - Public URL generation
    - Private URL with auth
    - Image not found → 404
  - Acceptance: Image access patterns tested

## Detailed Implementation

### Example: Database Integration Test

**File:** `src/lib/db/__tests__/batch.integration.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createClient } from '@supabase/supabase-js';
import { createBatch, getBatchById, updateBatchStatus } from '../batch';
import { setupTestDatabase, cleanupTestDatabase, createTestUser } from '@/__tests__/integration-utils';

describe('Batch Database Operations - Integration', () => {
  let testUserId: string;
  let supabase: ReturnType<typeof createClient>;

  beforeEach(async () => {
    supabase = await setupTestDatabase();
    testUserId = await createTestUser(supabase);
  });

  afterEach(async () => {
    await cleanupTestDatabase(supabase);
  });

  describe('createBatch', () => {
    it('creates batch with valid data', async () => {
      const batchData = {
        userId: testUserId,
        templateId: 'ecommerce-base',
        batchFile: 'fixtures/test.json',
        label: 'test-batch',
      };

      const result = await createBatch(batchData);

      expect(result).toMatchObject({
        id: expect.any(String),
        user_id: testUserId,
        template_id: 'ecommerce-base',
        status: 'queued',
        created_at: expect.any(String),
      });

      // Verify it's actually in the database
      const fetched = await getBatchById(result.id);
      expect(fetched).toMatchObject(result);
    });

    it('throws error for invalid template ID', async () => {
      const batchData = {
        userId: testUserId,
        templateId: 'non-existent-template',
        batchFile: 'test.json',
        label: 'test',
      };

      await expect(createBatch(batchData)).rejects.toThrow(/template.*not found/i);
    });

    it('enforces RLS - user cannot create batch for another user', async () => {
      const otherUserId = await createTestUser(supabase);

      const batchData = {
        userId: otherUserId,
        templateId: 'ecommerce-base',
        batchFile: 'test.json',
        label: 'test',
      };

      // Switch to first user's context
      const userSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false } }
      );

      await expect(createBatch(batchData)).rejects.toThrow(/permission denied/i);
    });
  });

  describe('updateBatchStatus', () => {
    it('updates status from queued to processing', async () => {
      const batch = await createBatch({
        userId: testUserId,
        templateId: 'ecommerce-base',
        batchFile: 'test.json',
        label: 'test',
      });

      await updateBatchStatus(batch.id, 'processing');

      const updated = await getBatchById(batch.id);
      expect(updated.status).toBe('processing');
      expect(updated.updated_at).not.toBe(batch.updated_at);
    });

    it('prevents invalid status transitions', async () => {
      const batch = await createBatch({
        userId: testUserId,
        templateId: 'ecommerce-base',
        batchFile: 'test.json',
        label: 'test',
      });

      // Cannot go from queued to completed (must go through processing)
      await expect(
        updateBatchStatus(batch.id, 'completed')
      ).rejects.toThrow(/invalid status transition/i);
    });
  });
});
```

---

### Example: API Route Integration Test

**File:** `src/app/api/batch/__tests__/route.integration.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'bun:test';
import { POST, GET } from '../route';
import { setupTestDatabase, createTestUser, createAuthToken } from '@/__tests__/integration-utils';

describe('POST /api/batch - Integration', () => {
  let testUserId: string;
  let authToken: string;

  beforeEach(async () => {
    const db = await setupTestDatabase();
    testUserId = await createTestUser(db);
    authToken = await createAuthToken(testUserId);
  });

  it('creates batch with valid authenticated request', async () => {
    const request = new Request('http://localhost:3000/api/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        templateId: 'ecommerce-base',
        batchFile: 'fixtures/test.json',
        label: 'integration-test-batch',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data).toMatchObject({
      batchId: expect.any(String),
      status: 'queued',
      jobCount: expect.any(Number),
      creditsConsumed: expect.any(Number),
    });
  });

  it('returns 400 for missing template ID', async () => {
    const request = new Request('http://localhost:3000/api/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        batchFile: 'test.json',
        // Missing templateId
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toMatch(/templateId.*required/i);
  });

  it('returns 401 for missing auth token', async () => {
    const request = new Request('http://localhost:3000/api/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId: 'ecommerce-base',
        batchFile: 'test.json',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('returns 402 for insufficient credits', async () => {
    // Create user with 0 credits
    const poorUserId = await createTestUser(db, { credits: 0 });
    const poorUserToken = await createAuthToken(poorUserId);

    const request = new Request('http://localhost:3000/api/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${poorUserToken}`,
      },
      body: JSON.stringify({
        templateId: 'ecommerce-base',
        batchFile: 'fixtures/large-batch.json', // Requires many credits
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(402); // Payment Required

    const data = await response.json();
    expect(data.error).toMatch(/insufficient credits/i);
    expect(data.required).toBeGreaterThan(0);
    expect(data.available).toBe(0);
  });
});
```

## Acceptance Criteria

- [ ] All database operations have integration tests
- [ ] All API routes have integration tests covering success and error paths
- [ ] R2 storage operations have integration tests
- [ ] Tests can run against test database without affecting production
- [ ] Test coverage for integration tests ≥80%
- [ ] All tests pass consistently
- [ ] No flaky tests (run 10 times, all pass)

## Files to Create/Modify

### Files to Create
- `src/__tests__/integration-utils.ts` - Shared integration test utilities
- `src/lib/db/__tests__/batch.integration.test.ts` - Batch DB tests
- `src/lib/db/__tests__/credits.integration.test.ts` - Credit transaction tests
- `src/lib/db/__tests__/rls.integration.test.ts` - RLS policy tests
- `src/app/api/batch/__tests__/route.integration.test.ts` - Batch API tests
- `src/lib/r2/__tests__/integration.test.ts` - R2 storage tests

### Files to Modify
- None (these are new tests, don't modify existing code)

## Dependencies

**Internal:**
- Bun test framework (already installed)
- @supabase/supabase-js (already installed)
- Existing database schema and RPC functions

**External:**
- Test Supabase project or local Supabase instance
- Test R2 bucket (or mock R2 for non-upload tests)

**Environment Variables Needed:**
```bash
# Test database (separate from production)
TEST_SUPABASE_URL=https://xxx.supabase.co
TEST_SUPABASE_ANON_KEY=xxx
TEST_SUPABASE_SERVICE_KEY=xxx

# Test R2 bucket
TEST_R2_BUCKET_NAME=productpix-test
TEST_R2_ACCOUNT_ID=xxx
TEST_R2_ACCESS_KEY_ID=xxx
TEST_R2_SECRET_ACCESS_KEY=xxx
```

## Testing Strategy

**Setup:**
```bash
# Create test database
# Option 1: New Supabase project (recommended)
# Option 2: Local Supabase with Docker

# Run migrations on test database
npx supabase db push --db-url $TEST_SUPABASE_URL

# Seed minimal test data
npx supabase db seed
```

**Running tests:**
```bash
# Run only integration tests
bun test --name-pattern "integration"

# Run specific integration test file
bun test src/lib/db/__tests__/batch.integration.test.ts

# Run with coverage
bun test --name-pattern "integration" --coverage
```

## Estimated Effort

- Task 1 (Infrastructure): **2-3 hours**
- Task 2 (Batch DB tests): **3-4 hours**
- Task 3 (Credit tests): **2-3 hours**
- Task 4 (RLS tests): **2 hours**
- Task 5 (Batch API tests): **3-4 hours**
- Task 6 (Other API routes): **2-3 hours**
- Task 7 (R2 tests): **2-3 hours**

**Total: 16-22 hours (2-3 days)**

## Success Metrics

- **Coverage increase**: +15-20% overall coverage
- **Critical paths tested**: 100% of database operations
- **API routes tested**: 100% of production routes
- **Production bugs prevented**: Catch integration issues before deployment
- **Confidence increase**: Can refactor with safety net

## Next Steps

After completing Phase 2, proceed to:
- **Phase 3: CSS Class Test Refactoring** (reduce brittleness)
- **Phase 4: Form and Error Tests** (user experience coverage)
