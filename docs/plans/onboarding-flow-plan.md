# Onboarding Flow Implementation Plan

## Overview

Create a multi-step onboarding wizard for new users that guides them through their first image generation, grants signup credits, and presents credit pack upsell options.

**User Flow:**
```
Signup → /onboarding → Upload → Template → Generate (loading) → Result → Upsell → Dashboard
                 ↓                                                        ↓
              [Skip] ────────────────────────────────────────────────→ Dashboard
```

## Architecture Decisions

- **State Management**: Use `useState` for step tracking (matches existing batch wizard pattern in `src/app/batch/new/page.tsx`)
- **Credit Granting**: Database trigger update (atomic, reliable) with one-time backfill for existing users
- **Completion Tracking**: Store in `users.preferences` JSONB field (no schema change needed)
- **Error Handling**: Retry on first failure, graceful exit with admin logging on second failure
- **Routing**: Redirect from auth callback to `/onboarding`; client-side check in dashboard as fallback

## Implementation Tasks

### Phase 1: Database & Backend

- [ ] Create migration to update signup trigger and backfill existing users
  - Files: `supabase/migrations/YYYYMMDDHHMMSS_grant_signup_credits.sql` (new)
  - Tests: Manual verification via Supabase dashboard
  - Acceptance:
    - New users receive 5 credits on signup
    - Transaction recorded in `credit_transactions` with idempotency key
    - Existing users without signup bonus receive backfill credits

- [ ] Create API endpoint to mark onboarding complete
  - Files: `src/app/api/onboarding/complete/route.ts` (new)
  - Tests: `src/app/api/onboarding/__tests__/complete.test.ts` (new)
  - Acceptance:
    - POST request updates `users.preferences.onboarding_completed = true`
    - Returns 401 if not authenticated
    - Returns 200 on success

### Phase 2: Onboarding Page Structure

- [ ] Create onboarding page with wizard container
  - Files: `src/app/onboarding/page.tsx` (new)
  - Tests: `src/app/onboarding/__tests__/page.test.tsx` (new)
  - Acceptance:
    - Page renders with progress indicator
    - Skip button visible at all steps
    - Protected route (redirects to login if unauthenticated)

- [ ] Create onboarding wizard component with state machine
  - Files: `src/components/onboarding/onboarding-wizard.tsx` (new)
  - Tests: `src/components/onboarding/__tests__/onboarding-wizard.test.tsx` (new)
  - Acceptance:
    - Manages step state: `'upload' | 'template' | 'generating' | 'result' | 'upsell' | 'error-exit'`
    - Passes appropriate props to each step component
    - Handles skip functionality

- [ ] Create progress indicator component
  - Files: `src/components/onboarding/onboarding-progress.tsx` (new)
  - Tests: `src/components/onboarding/__tests__/onboarding-progress.test.tsx` (new)
  - Acceptance:
    - Shows 5 steps: Upload → Style → Generate → Result → Get Credits
    - Current step highlighted
    - Completed steps show checkmark

- [ ] Create barrel export for onboarding components
  - Files: `src/components/onboarding/index.ts` (new)
  - Tests: None required
  - Acceptance: All onboarding components exported

### Phase 3: Step Components

- [ ] Create upload step component
  - Files: `src/components/onboarding/steps/upload-step.tsx` (new)
  - Tests: `src/components/onboarding/steps/__tests__/upload-step.test.tsx` (new)
  - Acceptance:
    - Reuses `UploadForm` component
    - Upload is required
    - "Continue" button enabled after successful upload
    - Passes uploadId and previewUrl to parent

- [ ] Create template step component
  - Files: `src/components/onboarding/steps/template-step.tsx` (new)
  - Tests: `src/components/onboarding/steps/__tests__/template-step.test.tsx` (new)
  - Acceptance:
    - Shows available templates (currently `ecommerce-base`)
    - Auto-selects if only one template available
    - Brief description of template
    - "Generate" button to proceed

- [ ] Create generating step component with retry logic
  - Files: `src/components/onboarding/steps/generating-step.tsx` (new)
  - Tests: `src/components/onboarding/steps/__tests__/generating-step.test.tsx` (new)
  - Acceptance:
    - Reuses `GenerationLoading` component
    - Shows "~1 minute" time estimate
    - First failure: shows error + "Try Again" button
    - Second failure: transitions to error-exit state
    - Calls `/api/generate` with uploadId and templateSlug

- [ ] Create result step component
  - Files: `src/components/onboarding/steps/result-step.tsx` (new)
  - Tests: `src/components/onboarding/steps/__tests__/result-step.test.tsx` (new)
  - Acceptance:
    - Reuses `GenerationResult` component (without regenerate)
    - Download button available
    - "Continue" button to proceed to upsell

- [ ] Create upsell step component
  - Files: `src/components/onboarding/steps/upsell-step.tsx` (new)
  - Tests: `src/components/onboarding/steps/__tests__/upsell-step.test.tsx` (new)
  - Acceptance:
    - Embeds `CreditPacks` component
    - Shows remaining credits: "You have X credits remaining"
    - Primary CTA: credit pack purchase buttons
    - Secondary CTA: "Go to Dashboard" (completes onboarding)

- [ ] Create error exit component for graceful failure
  - Files: `src/components/onboarding/steps/error-exit.tsx` (new)
  - Tests: `src/components/onboarding/steps/__tests__/error-exit.test.tsx` (new)
  - Acceptance:
    - Message: "We're looking into this"
    - Confirms credits weren't charged
    - "We'll notify you when resolved"
    - "Go to Dashboard" button
    - Logs structured error for admin: `[ONBOARDING_GENERATION_FAILURE]`

- [ ] Create barrel export for step components
  - Files: `src/components/onboarding/steps/index.ts` (new)
  - Tests: None required
  - Acceptance: All step components exported

### Phase 4: Routing & Integration

- [ ] Update auth callback to redirect to onboarding
  - Files: `src/app/auth/callback/route.ts` (modify)
  - Tests: Existing tests should be updated
  - Acceptance:
    - Line 7: Change `'/dashboard'` to `'/onboarding'`
    - New users land on onboarding after signup

- [ ] Add onboarding check to dashboard
  - Files: `src/app/dashboard/page.tsx` (modify)
  - Tests: Update existing dashboard tests
  - Acceptance:
    - Check `profile.preferences?.onboarding_completed`
    - If false, redirect to `/onboarding`
    - Prevents users from bypassing onboarding

### Phase 5: Types & Utilities

- [ ] Create onboarding types
  - Files: `src/lib/onboarding/types.ts` (new)
  - Tests: None required (type-only)
  - Acceptance:
    - `OnboardingStep` type union
    - `OnboardingState` interface
    - `OnboardingActions` interface

- [ ] Create onboarding constants
  - Files: `src/lib/onboarding/constants.ts` (new)
  - Tests: None required
  - Acceptance:
    - Step labels and descriptions
    - Error messages
    - Time estimate constant

- [ ] Create onboarding barrel export
  - Files: `src/lib/onboarding/index.ts` (new)
  - Tests: None required
  - Acceptance: All onboarding utilities exported

## Acceptance Criteria

- [ ] All tests pass (`bun test`)
- [ ] No TypeScript errors (`bun build`)
- [ ] Test coverage ≥75% for new code
- [ ] New users receive 5 credits on signup
- [ ] Onboarding wizard completes full flow: Upload → Template → Generate → Result → Upsell → Dashboard
- [ ] Skip button works at any step and marks onboarding complete
- [ ] Generation retry works on first failure
- [ ] Graceful exit on second failure with error logging
- [ ] Existing users redirected to onboarding if not completed
- [ ] Completed users go directly to dashboard

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/migrations/YYYYMMDDHHMMSS_grant_signup_credits.sql` | Grant signup credits via trigger |
| `src/app/onboarding/page.tsx` | Onboarding page |
| `src/app/api/onboarding/complete/route.ts` | Mark onboarding complete API |
| `src/components/onboarding/index.ts` | Barrel export |
| `src/components/onboarding/onboarding-wizard.tsx` | Main wizard component |
| `src/components/onboarding/onboarding-progress.tsx` | Progress indicator |
| `src/components/onboarding/steps/index.ts` | Steps barrel export |
| `src/components/onboarding/steps/upload-step.tsx` | Upload step |
| `src/components/onboarding/steps/template-step.tsx` | Template selection step |
| `src/components/onboarding/steps/generating-step.tsx` | Generation with retry |
| `src/components/onboarding/steps/result-step.tsx` | Result display step |
| `src/components/onboarding/steps/upsell-step.tsx` | Credit packs upsell |
| `src/components/onboarding/steps/error-exit.tsx` | Graceful error exit |
| `src/lib/onboarding/index.ts` | Lib barrel export |
| `src/lib/onboarding/types.ts` | TypeScript types |
| `src/lib/onboarding/constants.ts` | Constants |

## Files to Modify

| File | Change |
|------|--------|
| `src/app/auth/callback/route.ts` | Change default redirect from `/dashboard` to `/onboarding` |
| `src/app/dashboard/page.tsx` | Add redirect to `/onboarding` if not completed |

## Dependencies

### Internal Dependencies
- `src/components/forms/upload-form.tsx` - Reuse for upload step
- `src/components/generation-loading.tsx` - Reuse for generating step
- `src/components/generation-result.tsx` - Reuse for result step
- `src/components/pricing/credit-packs.tsx` - Reuse for upsell step
- `src/components/ui/step-indicator.tsx` - Pattern reference for progress
- `src/components/layout/page-container.tsx` - Page wrapper
- `src/components/ui/card.tsx` - Content containers
- `src/components/ui/button.tsx` - Action buttons

### External Dependencies
- None (all dependencies already in project)

## Task Dependencies

```
Phase 1 (Database) ──┬──→ Phase 2 (Page Structure)
                     │
                     └──→ Phase 4 (Routing - auth callback change)

Phase 2 ──→ Phase 3 (Step Components)

Phase 3 ──→ Phase 4 (Dashboard check)

Phase 5 (Types) can run in parallel with Phases 2-3
```

## Database Migration Details

```sql
-- Migration: grant_signup_credits.sql

-- 1. Update handle_new_user to grant signup credits
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_free_credits INTEGER := 5;
BEGIN
  INSERT INTO public.users (id, email, credit_balance, preferences)
  VALUES (NEW.id, NEW.email, v_free_credits, '{"onboarding_completed": false}'::jsonb);

  INSERT INTO public.credit_transactions (
    user_id, amount, balance_after, transaction_type, description, idempotency_key
  ) VALUES (
    NEW.id, v_free_credits, v_free_credits, 'bonus', 'Signup bonus credits', 'signup_bonus_' || NEW.id::text
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Backfill existing users who never got signup credits
INSERT INTO public.credit_transactions (user_id, amount, balance_after, transaction_type, description, idempotency_key)
SELECT
  u.id,
  5,
  u.credit_balance + 5,
  'bonus',
  'Signup bonus credits (backfill)',
  'signup_bonus_' || u.id::text
FROM public.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.credit_transactions ct
  WHERE ct.user_id = u.id
  AND ct.idempotency_key = 'signup_bonus_' || u.id::text
);

-- Update balances for backfilled users
UPDATE public.users u
SET credit_balance = credit_balance + 5
WHERE EXISTS (
  SELECT 1 FROM public.credit_transactions ct
  WHERE ct.user_id = u.id
  AND ct.idempotency_key = 'signup_bonus_' || u.id::text
  AND ct.description = 'Signup bonus credits (backfill)'
);
```

## Component State Shape

```typescript
type OnboardingStep = 'upload' | 'template' | 'generating' | 'result' | 'upsell' | 'error-exit';

interface OnboardingState {
  step: OnboardingStep;
  uploadId: string | null;
  previewUrl: string | null;
  templateSlug: string;
  result: { imageUrl: string; jobId: string } | null;
  error: string | null;
  retryCount: number;
}
```

## Error Logging Format

```typescript
console.error('[ONBOARDING_GENERATION_FAILURE]', {
  userId,
  uploadId,
  templateSlug,
  retryCount,
  error: error.message,
  timestamp: new Date().toISOString(),
});
```
