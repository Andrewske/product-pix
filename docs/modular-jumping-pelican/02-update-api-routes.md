# Update API Routes

## Files to Modify
- `src/app/api/generate/route.ts` (modify)
- `src/app/api/batch/route.ts` (modify)
- `supabase/migrations/YYYYMMDDHHMMSS_add_generation_mode_columns.sql` (create)

## Implementation Details

### 1. Create Database Migration

Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_add_generation_mode_columns.sql`

```sql
-- Add generation_mode and credits_charged columns to jobs table
ALTER TABLE jobs
ADD COLUMN generation_mode TEXT,
ADD COLUMN credits_charged INTEGER;

-- Add comment explaining the columns
COMMENT ON COLUMN jobs.generation_mode IS 'Processing mode: lightning (fast) or snail (economy)';
COMMENT ON COLUMN jobs.credits_charged IS 'Exact credits charged for this generation (for accurate refunds)';

-- Add check constraint for valid modes
ALTER TABLE jobs
ADD CONSTRAINT jobs_generation_mode_check
CHECK (generation_mode IN ('lightning', 'snail') OR generation_mode IS NULL);
```

**Rationale:**
- `generation_mode` - Tracks which pricing tier was used (audit trail + analytics)
- `credits_charged` - Stores exact amount charged (critical for accurate refunds if pricing changes)
- Nullable for backwards compatibility with existing jobs
- Check constraint ensures data integrity

### 2. Add Request Schema Validation

Before updating route handlers, add Zod schema for request validation:

```typescript
import { z } from 'zod';

const GenerateRequestSchema = z.object({
  // ... existing fields ...
  mode: z.enum(['lightning', 'snail']).optional().default('lightning'),
  addons: z.array(z.string()).optional(),
});
```

**Apply schema in route handler:**
```typescript
// Validate request body
const validationResult = GenerateRequestSchema.safeParse(requestBody);
if (!validationResult.success) {
  return NextResponse.json({
    error: 'Invalid request',
    details: validationResult.error.issues
  }, { status: 400 });
}

const { mode, addons, resolution, ... } = validationResult.data;
```

### 3. Update `src/app/api/generate/route.ts`

**Current implementation (line 76):**
```typescript
const creditCost = getCreditsForResolution(resolution);
```

**New implementation:**
```typescript
// Already validated by Zod schema above
const costBreakdown = calculateGenerationCost({
  resolution,
  mode, // From validated request
  addons // From validated request (optional)
});
const creditCost = costBreakdown.total;
```

**Changes needed:**
1. Import `calculateGenerationCost` and `GenerationMode` from `@/lib/pricing`
2. Add Zod schema validation at start of route handler
3. Extract `mode` and `addons` from validated request
4. Calculate cost breakdown (replaces single credit calculation)
5. Use `costBreakdown.total` for credit consumption via `consume_credits` RPC
6. **CRITICAL**: Store `mode` and `creditCost` in database when creating job:

```typescript
// When inserting job record
const { data: job, error } = await supabase
  .from('jobs')
  .insert({
    // ... existing fields ...
    generation_mode: mode,
    credits_charged: creditCost
  })
  .select()
  .single();
```

**For refunds**, always use stored value:
```typescript
// In refund logic
await supabase.rpc('refund_credits', {
  user_id: userId,
  amount: job.credits_charged, // Use stored value, NEVER recalculate
  reason: 'generation_failed'
});
```

### 4. Update `src/app/api/batch/route.ts`

**Current implementation (line 57):**
```typescript
const totalCredits = calculateBatchCredits(items);
```

**New implementation:**
```typescript
const totalCredits = items.reduce((sum, item) => {
  const cost = calculateGenerationCost({
    resolution: item.resolution,
    mode: 'snail', // Batch uploads always use snail pricing
    addons: item.addons // Future feature support
  });
  return sum + cost.total;
}, 0);
```

**Changes needed:**
1. Import `calculateGenerationCost` from `@/lib/pricing`
2. Replace `calculateBatchCredits()` call with inline reduce
3. Force `mode: 'snail'` for all batch items (batch uploads = economy pricing)
4. Support optional `addons` array on each item for future features
5. Sum total credits across all items
6. **Store mode and credits** when creating each batch job:

```typescript
// For each batch item job creation
const { error } = await supabase
  .from('jobs')
  .insert({
    // ... existing fields ...
    generation_mode: 'snail',
    credits_charged: cost.total // Per-item cost
  });
```

**Error response updates:**
Both routes should include cost breakdown in error responses for better user feedback:
```typescript
// In 402 Insufficient Credits response
return NextResponse.json({
  error: 'Insufficient credits',
  required: creditCost,
  balance: userBalance,
  costBreakdown: costBreakdown // New field
}, { status: 402 });
```

## Acceptance Criteria

**Database:**
- [ ] Migration file created and applied successfully
- [ ] `jobs` table has `generation_mode` column (text, nullable, check constraint)
- [ ] `jobs` table has `credits_charged` column (integer, nullable)

**API Routes:**
- [ ] `/api/generate` accepts optional `mode` parameter with Zod validation
- [ ] `/api/generate` defaults to `mode: 'lightning'` when not provided
- [ ] `/api/generate` validates mode is 'lightning' or 'snail' only
- [ ] `/api/generate` calculates credits using `calculateGenerationCost()`
- [ ] `/api/generate` stores `generation_mode` and `credits_charged` in job record
- [ ] `/api/batch` forces `mode: 'snail'` for all items
- [ ] `/api/batch` correctly sums credits across multiple items
- [ ] `/api/batch` stores mode and credits for each batch job
- [ ] Both APIs support optional `addons` array (even if unused now)
- [ ] 402 error responses include cost breakdown
- [ ] Refund logic uses stored `credits_charged`, never recalculates
- [ ] No TypeScript compilation errors
- [ ] Existing generation flow still works

## Dependencies

**Requires completion of:** Task 01 - Update Configuration and Types

The new calculation functions must be implemented and exported before the API routes can use them.
