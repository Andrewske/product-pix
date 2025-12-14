# Database Layer

## Files to Modify/Create
- `src/lib/db/feedback.ts` (new)
- `src/lib/db/__tests__/feedback.test.ts` (new)
- `src/lib/db/index.ts` (modify)

## Implementation Details

### Task 3.1: Create feedback database functions

Implement database access layer for feedback operations.

**File: `src/lib/db/feedback.ts`**

Implement these functions:
```typescript
// Submit or update feedback (UPSERT pattern)
submitFeedback(userId: string, params: SubmitFeedbackParams): Promise<ImageFeedback | null>

// Retrieve user's feedback for specific image
getFeedbackForImage(imageId: string, userId: string): Promise<ImageFeedback | null>

// Delete user's feedback
deleteFeedback(imageId: string, userId: string): Promise<boolean>
```

**Implementation Requirements:**
- Use Supabase client (server or admin as appropriate)
- Handle camelCase ↔ snake_case conversion
- Return null on errors (log with centralized logging)
- Use UPSERT for `submitFeedback` (insert or update based on unique constraint)

**File: `src/lib/db/__tests__/feedback.test.ts`**

Test coverage should include:
- submitFeedback creates new feedback
- submitFeedback updates existing feedback (UPSERT)
- getFeedbackForImage returns feedback when exists
- getFeedbackForImage returns null when doesn't exist
- deleteFeedback removes feedback successfully
- Error handling (DB errors, invalid params)

**Mock Strategy:**
- Mock Supabase client methods
- Use Bun's `mock()` for function mocking
- No @testing-library/jest-dom matchers (use Bun matchers only)

### Task 3.2: Export from db index

Update barrel export to include feedback functions.

**File: `src/lib/db/index.ts`**

Add:
```typescript
export * from './feedback';
```

## Acceptance Criteria
- [ ] All three functions implemented and exported
- [ ] Unit tests pass for all functions
- [ ] Coverage ≥75% for `feedback.ts`
- [ ] UPSERT behavior verified (update on conflict)
- [ ] Error cases handled gracefully
- [ ] Import like `import { submitFeedback } from '@/lib/db'` works

## Dependencies
- Task 01: Database Foundation (table must exist)
- Task 02: Types and Constants (for TypeScript interfaces)

## Technical Notes
- **UPSERT Pattern:** Use `.upsert()` with `onConflict` parameter
- **RLS:** Functions will respect RLS policies (user can only access own feedback)
- **Testing:** Use Bun test framework, avoid Jest-specific matchers
