# Code Review Fixes Plan

**Commit**: dc5440dc - feat: implement prompt-bench build exclusion
**Review Date**: 2025-12-09
**Status**: Pending fixes

## Critical Fixes

### 1. Remove duplicate email check
**File**: `src/app/api/stripe/checkout/route.ts:17-22`
**Issue**: Email validation block is duplicated verbatim
**Fix**: Delete lines 20-22 (the duplicate `if (!user.email)` block)

```typescript
// REMOVE THIS DUPLICATE:
if (!user.email) {
  return NextResponse.json({ error: 'Email required for checkout' }, { status: 400 });
}
```

## Important Fixes

### 2. Restore missing type export
**File**: `prompt-bench/core/types.ts`
**Issue**: `CompareCommandOptions` type was removed but schema remains
**Fix**: Add type export at end of file

```typescript
export type CompareCommandOptions = z.infer<typeof CompareCommandOptionsSchema>;
```

### 3. Add explicit return type
**File**: `src/lib/auth/server.ts:3`
**Issue**: Function lacks explicit return type per project conventions
**Fix**: Import `User` type and add return type annotation

```typescript
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

export const requireAuth = async (): Promise<User> => {
  // ...
};
```

### 4. Replace `any[]` with proper type
**File**: `src/lib/ai/gemini-batch.ts:72`
**Issue**: Using `any[]` violates project's strict typing rule
**Fix**: Define proper type for Gemini content parts

```typescript
interface GeminiInlineData {
  inline_data: {
    mime_type: string;
    data: string;
  };
}

interface GeminiTextPart {
  text: string;
}

type GeminiContentPart = GeminiInlineData | GeminiTextPart;

// Then use:
const parts: GeminiContentPart[] = [];
```

## Suggestions (Lower Priority)

### 5. Fix Button component usage
**Files**:
- `src/components/billing/subscription-status.tsx`
- `src/components/generation/insufficient-credits-modal.tsx`

**Issue**: `<Button asChild>` replaced with raw anchors and duplicated Tailwind classes
**Fix**: Restore proper Button component usage or create reusable `ButtonLink`

```typescript
// Option A: Use Next.js Link with Button
import Link from 'next/link';

<Button asChild>
  <Link href="/pricing">View Plans</Link>
</Button>

// Option B: Create ButtonLink component
<ButtonLink href="/pricing">View Plans</ButtonLink>
```

### 6. Clean up CLAUDE.md formatting
**File**: `CLAUDE.md`
**Issue**: Multiple consecutive blank lines in Architecture Decision section
**Fix**: Reduce to single blank lines between sections

### 7. Improve auth error message
**File**: `src/lib/auth/server.ts`
**Issue**: Generic error message lacks debugging context
**Fix**: Include more details

```typescript
if (error) {
  throw new Error(`Authentication required: ${error.message}`);
}
if (!user) {
  throw new Error('Authentication required: no user session found');
}
```

## Verification Checklist

After fixes:
- [ ] `bun run build` succeeds
- [ ] `bun test` passes
- [ ] `bun bench sync` works
- [ ] No TypeScript errors in IDE
