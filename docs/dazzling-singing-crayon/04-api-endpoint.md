# API Endpoint

## Files to Modify/Create
- `src/app/api/images/[id]/feedback/route.ts` (new)
- `src/app/api/images/[id]/feedback/__tests__/route.test.ts` (new)

## Implementation Details

### Task 4.1: Create feedback API route

Implement REST API endpoint for feedback operations.

**File: `src/app/api/images/[id]/feedback/route.ts`**

**Endpoints:**

**POST /api/images/[id]/feedback** - Submit/update feedback
```typescript
// Request body validation with Zod
{
  feedbackType: 'positive' | 'negative',
  reasons: string[],        // Valid reasons for the feedback type
  comment?: string          // Optional, max 1000 chars
}

// Response: 200 OK with ImageFeedback object
// Response: 403 Forbidden if user doesn't own image
// Response: 400 Bad Request if validation fails
```

**GET /api/images/[id]/feedback** - Get user's feedback
```typescript
// No request body
// Response: 200 OK with ImageFeedback object or null
// Response: 401 Unauthorized if not authenticated
```

**DELETE /api/images/[id]/feedback** - Remove feedback
```typescript
// No request body
// Response: 204 No Content on success
// Response: 401 Unauthorized if not authenticated
```

**CRITICAL Security Check:**
```typescript
// Verify user owns/generated the image before allowing feedback
const { data: image } = await supabase
  .from('generated_images')
  .select('user_id')
  .eq('id', imageId)
  .single();

if (!image || image.user_id !== userId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
}
```

**Zod Validation Schema:**
```typescript
const feedbackSchema = z.object({
  feedbackType: z.enum(['positive', 'negative']),
  reasons: z.array(z.string()),
  comment: z.string().max(1000).optional(),
});

// Additional validation: reasons must match feedback type
// - If positive: reasons must be from POSITIVE_FEEDBACK_REASONS
// - If negative: reasons must be from NEGATIVE_FEEDBACK_REASONS
```

**File: `src/app/api/images/[id]/feedback/__tests__/route.test.ts`**

Test coverage:
- POST creates feedback successfully
- POST updates existing feedback (UPSERT)
- POST rejects if user doesn't own image (403)
- POST validates reasons match feedback type
- POST validates comment length
- GET returns feedback when exists
- GET returns null when doesn't exist
- DELETE removes feedback successfully
- All endpoints require authentication (401)

## Acceptance Criteria
- [ ] All three HTTP methods (POST, GET, DELETE) implemented
- [ ] Image ownership validation prevents unauthorized feedback
- [ ] Zod schema validates request bodies
- [ ] Reasons validated to match feedback type
- [ ] Comment length limited to 1000 chars
- [ ] All tests pass
- [ ] Error responses use correct status codes
- [ ] Authentication required for all endpoints

## Dependencies
- Task 01: Database Foundation (table must exist)
- Task 02: Types and Constants (for validation)
- Task 03: Database Layer (uses db functions)

## Technical Notes
- **Authentication:** Use Next.js server-side auth to get user ID
- **Validation:** Reasons array must contain only valid reasons for the feedback type
- **UPSERT:** POST endpoint handles both create and update cases
- **Security:** Never trust client to provide correct user_id, always use auth.uid()
