# Fix Remaining Violations

## Files to Modify
- Additional files discovered after Task 05
- Potentially `src/lib/email/*.ts` files
- Any other library code with violations

## Implementation Details

After completing tasks 01-05, there may be ~37 remaining violations. This task handles any remaining cases.

### Discovery Process

**Step 1: Get current violation list**
```bash
bun lint > lint-output.txt
```

**Step 2: Analyze remaining violations**
- Group by file path
- Group by pattern similarity
- Identify common function types

**Step 3: Categorize by type**
Likely patterns:
- Email service functions (sending, templating)
- Additional database helpers
- Pricing/cost calculation utilities
- R2 storage helpers
- Auth utilities

### Implementation Strategy

**For each violation:**
1. Read the file containing the violation
2. Understand the function's purpose
3. Analyze return statements to infer type
4. Add explicit return type annotation

**Common patterns to expect:**

**Email functions:**
```typescript
// Likely void-returning (side effects)
async function sendContactEmail(data: ContactData): Promise<void>

// Or Result pattern
async function sendEmail(data: EmailData): Promise<Result<void>>
```

**Utility functions:**
```typescript
// Synchronous utilities
function formatCurrency(amount: number): string
function calculatePrice(params: PriceParams): number
```

**Async helpers:**
```typescript
// R2/Storage operations
async function uploadToR2(file: File): Promise<string>  // returns URL

// Database queries
async function findUser(id: string): Promise<User | null>
```

### Batch Processing

1. **Group by file** - fix all violations in one file at once
2. **Verify after each file** - run `bun lint` to track progress
3. **Document complex types** - if a return type is complex, consider extracting a type alias

### Edge Cases to Watch For

**HOC (Higher-Order Components):**
```typescript
function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  // wrapper logic
}
```

**Generic functions:**
```typescript
function createFactory<T>(config: Config): Factory<T> {
  // factory logic
}
```

**Complex Result types:**
```typescript
async function processImage(
  file: File
): Promise<Result<{ url: string; metadata: ImageMetadata }>> {
  // processing
}
```

## Implementation Steps

1. Run `bun lint` and capture output
2. Parse violations to identify affected files
3. Group violations by file and pattern
4. For each file:
   - Read file contents
   - Identify all functions needing types
   - Add return type annotations
   - Run `bun lint` to verify
5. Continue until all violations resolved

## Acceptance Criteria
- [ ] `bun lint` output analyzed and documented
- [ ] All remaining violations categorized
- [ ] Return types added to all functions
- [ ] All return types accurately reflect actual return values
- [ ] `bun lint` shows 0 violations for `explicit-function-return-type`
- [ ] `bun typecheck` passes with no errors
- [ ] `bun test` passes (all tests green)

## Expected Progression
Violations: ~37 → 0

## Dependencies
- Tasks 01-05 completed
- ESLint configuration updated
- Initial batches of violations fixed

## Testing Notes
After completion:
1. Run full test suite: `bun test`
2. Check TypeScript compilation: `bun typecheck`
3. Verify linting: `bun lint`
4. Ensure no runtime behavior changes
5. Spot-check a few functions to verify type accuracy
