# Comprehensive Tests

## Files to Modify/Create
- `src/lib/validation/__tests__/feedback.test.ts` (new)
- `src/lib/db/__tests__/feedback.test.ts` (modify)
- `src/app/api/images/[id]/feedback/__tests__/route.test.ts` (modify)
- `src/hooks/__tests__/use-image-feedback.test.tsx` (modify)
- `src/components/feedback/__tests__/feedback-buttons.test.tsx` (modify)
- `src/components/feedback/__tests__/negative-feedback-modal.test.tsx` (modify)
- `src/components/feedback/__tests__/positive-feedback-toast.test.tsx` (modify)

## Implementation Details

### Reference Patterns

Follow existing test patterns from:
- `src/lib/stripe/__tests__/credits.test.ts` - DB function mocking
- `src/app/api/refunds/cash/__tests__/route.test.ts` - API route testing
- `src/components/auth/__tests__/login-form.integration.test.tsx` - Component testing

### Test File 1: Type Guards (`src/lib/validation/__tests__/feedback.test.ts`)

```typescript
import { describe, it, expect } from 'bun:test';
import {
  isPositiveFeedbackReason,
  isNegativeFeedbackReason,
  areValidReasonsForType
} from '../feedback';

describe('Feedback Type Guards', () => {
  describe('isPositiveFeedbackReason', () => {
    it('returns true for valid positive reasons', () => {
      expect(isPositiveFeedbackReason('great_quality')).toBe(true);
      expect(isPositiveFeedbackReason('matched_request')).toBe(true);
      expect(isPositiveFeedbackReason('fast')).toBe(true);
    });

    it('returns false for negative reasons', () => {
      expect(isPositiveFeedbackReason('quality_issues')).toBe(false);
    });

    it('returns false for invalid values', () => {
      expect(isPositiveFeedbackReason('invalid')).toBe(false);
      expect(isPositiveFeedbackReason(123)).toBe(false);
      expect(isPositiveFeedbackReason(null)).toBe(false);
    });
  });

  describe('areValidReasonsForType', () => {
    it('validates positive reasons array', () => {
      expect(areValidReasonsForType(['great_quality', 'fast'], 'positive')).toBe(true);
      expect(areValidReasonsForType(['quality_issues'], 'positive')).toBe(false);
    });

    it('validates negative reasons array', () => {
      expect(areValidReasonsForType(['quality_issues', 'other'], 'negative')).toBe(true);
      expect(areValidReasonsForType(['great_quality'], 'negative')).toBe(false);
    });

    it('returns false for non-array', () => {
      expect(areValidReasonsForType('not-array' as any, 'positive')).toBe(false);
    });
  });
});
```

### Test File 2: Database Functions (`src/lib/db/__tests__/feedback.test.ts`)

```typescript
import { describe, it, expect, mock, beforeEach } from 'bun:test';

// Mock Supabase before importing
const mockSupabase = {
  from: mock(() => ({
    upsert: mock(() => ({
      select: mock(() => ({
        single: mock(() => Promise.resolve({
          data: {
            id: 'feedback-123',
            image_id: 'image-123',
            user_id: 'user-123',
            feedback_type: 'positive',
            reasons: ['great_quality'],
            comment: null,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
          },
          error: null
        }))
      }))
    })),
    select: mock(() => ({
      eq: mock(() => ({
        eq: mock(() => ({
          single: mock(() => Promise.resolve({ data: null, error: { code: 'PGRST116' } }))
        }))
      }))
    })),
    delete: mock(() => ({
      eq: mock(() => ({
        eq: mock(() => Promise.resolve({ error: null }))
      }))
    }))
  }))
};

mock.module('@/lib/supabase/admin', () => ({
  createAdminClient: mock(() => mockSupabase)
}));

// Import after mocking
const { submitFeedback, getFeedbackForImage, deleteFeedback } = await import('../feedback');

describe('Feedback Database Functions', () => {
  beforeEach(() => {
    mockSupabase.from.mockClear();
  });

  describe('submitFeedback', () => {
    it('submits feedback and returns mapped result', async () => {
      const result = await submitFeedback('user-123', {
        imageId: 'image-123',
        feedbackType: 'positive',
        reasons: ['great_quality'],
      });

      expect(result).not.toBeNull();
      expect(result?.imageId).toBe('image-123');
      expect(result?.feedbackType).toBe('positive');
    });

    it('returns null on error', async () => {
      // Override mock for this test
      mockSupabase.from.mockReturnValueOnce({
        upsert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: { message: 'DB error' } })
          })
        })
      } as any);

      const result = await submitFeedback('user-123', {
        imageId: 'image-123',
        feedbackType: 'positive',
        reasons: [],
      });

      expect(result).toBeNull();
    });
  });

  describe('getFeedbackForImage', () => {
    it('returns null when no feedback exists (PGRST116)', async () => {
      const result = await getFeedbackForImage('image-123', 'user-123');
      expect(result).toBeNull();
    });
  });

  describe('deleteFeedback', () => {
    it('returns true on successful delete', async () => {
      const result = await deleteFeedback('image-123', 'user-123');
      expect(result).toBe(true);
    });
  });
});
```

### Test File 3: API Route (`src/app/api/images/[id]/feedback/__tests__/route.test.ts`)

Test POST, GET, DELETE with mocked auth and ownership checks.

### Test File 4: Hook (`src/hooks/__tests__/use-image-feedback.test.tsx`)

Use `renderHook` with QueryClientProvider wrapper, test mutation states.

### Test File 5-7: Components

Test rendering, user interactions, state changes.

## Acceptance Criteria

- [ ] All tests pass with `bun test src/lib/validation`
- [ ] All tests pass with `bun test src/lib/db/__tests__/feedback.test.ts`
- [ ] All tests pass with `bun test src/app/api/images`
- [ ] All tests pass with `bun test src/hooks/__tests__/use-image-feedback.test.tsx`
- [ ] All tests pass with `bun test src/components/feedback`
- [ ] No placeholder `expect(true).toBe(true)` assertions remain
- [ ] Coverage target: 70-80% for new code

## Dependencies
- All previous tasks (testing stable code)
