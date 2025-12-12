# Contact Form Implementation Plan

## Overview

Implement a fully functional contact form with Supabase storage, rate limiting, and comprehensive validation. This addresses critical issues from the design-system branch code review, including fixing broken tests, creating the missing API endpoint, and adding proper validation.

**Note:** This plan covers only the contact form implementation. For other code review fixes (design system documentation, TypeScript improvements), see `docs/code-review-fixes-plan.md`.

## Architecture Decisions

### Storage: Supabase Database
**Decision:** Store contact submissions in Supabase with console logging (no email provider yet)

**Rationale:**
- Provides audit trail and persistence
- Can review submissions even if email delivery fails
- Console logging provides immediate notification during development
- Email provider can be added later without data migration

### Rate Limiting: IP-based
**Decision:** Rate limit by client IP address using existing `rateLimiters.api()`

**Rationale:**
- Contact form is public (no user authentication)
- IP-based prevents spam from same source
- Reuses existing rate limit infrastructure (Upstash Redis)
- 60 requests/min per IP is reasonable for legitimate use

### Validation: Defense in Depth
**Decision:** Zod validation on both client and server

**Rationale:**
- Client-side for UX (immediate feedback on field blur)
- Server-side for security (can't bypass validation)
- Same Zod schema ensures consistency between layers
- Follows existing codebase patterns

### Authentication: Public Endpoint
**Decision:** No `withAuth()` wrapper, use admin client for database writes

**Rationale:**
- Contact forms must be accessible to anonymous users
- Admin client bypasses RLS for public form submissions
- Rate limiting provides spam protection instead of auth

## Implementation Tasks

### Phase 1: Database Foundation (30 min)

- [ ] **Create contact_messages database table**
  - Files: `supabase/migrations/00018_create_contact_messages.sql` (new)
  - Schema fields: id, name, email, message, status, user_agent, ip_address, created_at, updated_at
  - Indexes: status, created_at DESC
  - RLS: Enabled with admin-only read policy (no public access)
  - Trigger: Auto-update updated_at timestamp
  - Tests: Manual verification via Supabase dashboard after migration
  - Acceptance: Migration applies without errors, table visible in dashboard

- [ ] **Generate TypeScript types from database schema**
  - Command: `npx supabase db push && npx supabase gen types ts > src/lib/supabase/database.types.ts`
  - Files: `src/lib/supabase/database.types.ts` (modify)
  - Acceptance: contact_messages type available in database.types.ts

- [ ] **Create database module for contact operations**
  - Files: `src/lib/db/contacts.ts` (new)
  - Exports:
    - `createContactMessage()` - Insert with admin client, returns `{ success, messageId?, error? }`
    - `getContactMessage(id)` - Fetch single message (admin use)
    - `listContactMessages(limit, offset)` - List recent messages (admin dashboard)
  - Pattern: Follow existing db modules (jobs.ts, credits.ts)
  - Uses: `createAdminClient()` from `@/lib/supabase/admin`
  - Logging: Use `logger` from `@/lib/logging`
  - Tests: Tested indirectly through API route tests
  - Acceptance: Functions compile with correct TypeScript types, no linting errors

- [ ] **Update database barrel export**
  - Files: `src/lib/db/index.ts` (modify)
  - Change: Add `export * from './contacts';`
  - Acceptance: Can import `createContactMessage` from `@/lib/db`

### Phase 2: Validation & API (45 min)

- [ ] **Create Zod validation schema**
  - Files: `src/lib/validation/contact.ts` (new)
  - Schema: `contactFormSchema` with name (1-100 chars), email (valid email, max 255), message (10-5000 chars)
  - All fields: `.trim()` for normalization
  - Email: `.toLowerCase()` for consistency
  - Export: `ContactFormData` type inferred from schema
  - Pattern: Follow existing schemas (batch, upload)
  - Tests: Covered through API route tests
  - Acceptance: Schema exports correctly, no TypeScript errors

- [ ] **Create contact API route**
  - Files: `src/app/api/contact/route.ts` (new)
  - Method: POST only (public endpoint, no auth wrapper)
  - Rate limiting: `rateLimiters.api(clientIp)` - 60/min per IP
  - Validation: `contactFormSchema.safeParse(body)`
  - Database: Call `createContactMessage()` from db module
  - Console logging: Log submission details (per user requirement)
  - Error responses:
    - 400: `{ error: 'Invalid request', details: ZodIssue[] }`
    - 429: `{ error: 'Too many requests...', retryAfter: 60 }` with Retry-After header
    - 500: `{ error: 'Failed to send message...' }`
  - Success response: `{ success: true, messageId: string }`
  - Logging: Use `logger.info()` for success, `logger.error()` for failures
  - IP extraction: Check x-forwarded-for, x-real-ip headers
  - User agent: Store from request headers for spam detection
  - Tests: `src/app/api/__tests__/contact.test.ts`
  - Acceptance: All test cases pass, 75%+ coverage

- [ ] **Create comprehensive API route tests**
  - Files: `src/app/api/__tests__/contact.test.ts` (new)
  - Framework: Bun test (not Jest)
  - Mocks: `mock.module()` for db/contacts and rate-limit
  - Test cases:
    1. Valid submission succeeds (200)
    2. Invalid email returns 400 with details
    3. Message too short returns 400
    4. Empty name returns 400
    5. Rate limit exceeded returns 429 with Retry-After
    6. Database error returns 500
    7. Data trimming and normalization works
  - Coverage target: 75%+
  - Acceptance: All tests pass, coverage meets target

### Phase 3: Frontend Validation (30 min)

- [ ] **Fix broken test import path**
  - Files: `src/app/__tests__/contact-page.test.tsx` (modify)
  - Change: Line 3 - `import { ContactForm } from '@/components/contact/contact-form'`
  - Issue: Currently imports from `'../contact-form'` which doesn't exist
  - Acceptance: Test file compiles without module resolution errors

- [ ] **Add client-side validation to ContactForm**
  - Files: `src/components/contact/contact-form.tsx` (modify)
  - Import: `contactFormSchema` and `ContactFormData` type
  - State additions:
    - `formData: ContactFormData` - typed form state
    - `fieldErrors: FieldErrors` - per-field error messages
  - Validation:
    - On blur: Validate individual field, show error below input
    - On submit: Validate entire form before API call
  - Error display:
    - Field-level errors below each input
    - `aria-invalid={!!error}` on inputs for accessibility
    - API errors in AlertBox component
  - Error handling:
    - 400 with details: Map to field errors
    - 429: Show "Too many requests..." message
    - 500: Show "Failed to send message"
  - Loading state: Disable form during submission
  - Success state: Already implemented, keep existing
  - Pattern: Follow existing form patterns (auth forms, settings)
  - Tests: Updated in next task
  - Acceptance: Form validates on blur, shows field errors, submits successfully

- [ ] **Complete ContactForm component tests**
  - Files: `src/app/__tests__/contact-page.test.tsx` (modify)
  - Mock: `global.fetch` with Bun `mock()`
  - Test cases:
    1. Renders all form fields correctly
    2. Shows validation errors on blur (name, email, message)
    3. Shows error for invalid email format
    4. Shows error for message too short
    5. Submits successfully with valid data
    6. Shows error message when API returns 500
    7. Shows rate limit error (429)
    8. "Send another message" resets form
  - Use: `@testing-library/user-event` for interactions
  - Use: `waitFor()` for async assertions
  - Coverage target: 80%+
  - Acceptance: All tests pass, coverage meets target


## Acceptance Criteria

### Functionality
- [ ] Contact form submits successfully with valid data
- [ ] Form shows field-level validation errors on blur
- [ ] API returns 400 for invalid data with detailed error messages
- [ ] API returns 429 when rate limit exceeded
- [ ] Contact messages stored in Supabase database
- [ ] Console logs message details on submission
- [ ] "Send another message" button resets form

### Code Quality
- [ ] All tests pass (`bun test`)
- [ ] No TypeScript errors (`bun run type-check` or editor checks)
- [ ] Test coverage ≥75% for new code
- [ ] ESLint passes with no new warnings
- [ ] Follows existing codebase patterns (FP style, no classes)

### Accessibility
- [ ] Form inputs have proper labels
- [ ] Error messages use aria-invalid
- [ ] Keyboard navigation works (tab order logical)
- [ ] Focus states visible on all interactive elements
- [ ] Color contrast meets WCAG AA standards


## Files to Create (5 files)

1. `supabase/migrations/00018_create_contact_messages.sql` - Database schema
2. `src/lib/db/contacts.ts` - Database operations module
3. `src/lib/validation/contact.ts` - Zod validation schema
4. `src/app/api/contact/route.ts` - API endpoint
5. `src/app/api/__tests__/contact.test.ts` - API tests

## Files to Modify (3 files)

1. `src/app/__tests__/contact-page.test.tsx` - Fix import path (line 3), add tests
2. `src/components/contact/contact-form.tsx` - Add client-side validation
3. `src/lib/db/index.ts` - Add barrel export for contacts module

## Dependencies

### External Dependencies (already installed)
- `zod` - Schema validation
- `@testing-library/react` - Component testing
- `@testing-library/user-event` - User interaction simulation
- `bun:test` - Test framework

### Internal Dependencies
- `@/lib/supabase/admin` - Admin client for database writes
- `@/lib/logging` - Centralized logging
- `@/lib/rate-limit` - Rate limiting infrastructure
- `@/components/ui/*` - UI components (Button, Input, Label, etc.)

### Task Dependencies
- Task 1.3 (db module) depends on Task 1.2 (migration)
- Task 1.4 (barrel export) depends on Task 1.3
- Task 1.6 (API route) depends on Tasks 1.3, 1.4, 1.5
- Task 1.7 (ContactForm) depends on Task 1.5 (schema)
- Task 1.8 (API tests) depends on Task 1.6
- Task 1.9 (component tests) depends on Tasks 1.1, 1.7

## Implementation Order

### Session 1: Database (30 min)
Execute Tasks 1.2 → 1.3 → 1.4 in sequence
```bash
npx supabase db push
npx supabase gen types ts > src/lib/supabase/database.types.ts
```

### Session 2: API (45 min)
Execute Tasks 1.5 → 1.6 → 1.8 in sequence
```bash
bun test src/app/api/__tests__/contact.test.ts
```

### Session 3: Frontend (30 min)
Execute Tasks 1.1 → 1.7 → 1.9 in sequence
```bash
bun test src/app/__tests__/contact-page.test.tsx
```

## Manual Testing Checklist

After implementation:

**Happy Path:**
- [ ] Navigate to /contact page
- [ ] Fill in name, email, message (valid data)
- [ ] Click "Send Message"
- [ ] See success message: "Message sent!"
- [ ] Check Supabase dashboard: contact_messages table has new row
- [ ] Check server console: Message logged with details

**Validation:**
- [ ] Leave name blank, tab away: See "Name is required"
- [ ] Enter invalid email, tab away: See "Please enter a valid email address"
- [ ] Enter short message (< 10 chars), tab away: See "Message must be at least 10 characters"
- [ ] Try to submit with errors: Submission blocked, errors shown

**Error Handling:**
- [ ] Submit 60+ times rapidly: See rate limit error (429)
- [ ] Network error: See "Failed to send message"

**Responsive Design:**
- [ ] Mobile viewport (375px): Form layout stacks properly
- [ ] Tablet viewport (768px): Two-column grid for name/email
- [ ] Desktop viewport (1024px+): All fields visible

**Accessibility:**
- [ ] Tab through form: Logical focus order
- [ ] Error fields: aria-invalid attribute present
- [ ] Screen reader: Labels announced correctly

## Pattern Examples

### Database Module Pattern
```typescript
// src/lib/db/contacts.ts
export const createContactMessage = async (
  params: CreateContactMessageParams
): Promise<{ success: boolean; error?: string; messageId?: string }> => {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('contact_messages')
      .insert({ ... })
      .select('id')
      .single();

    if (error) {
      logger.error('...', { error });
      return { success: false, error: 'Database error' };
    }

    logger.info('...', { messageId: data.id });
    return { success: true, messageId: data.id };
  } catch (error) {
    logger.error('...', { error });
    return { success: false, error: 'Internal server error' };
  }
};
```

### API Route Pattern
```typescript
// src/app/api/contact/route.ts
export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Extract client IP
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';

  // 2. Rate limit
  const rateLimit = await rateLimiters.api(clientIp);
  if (!rateLimit.success) {
    return NextResponse.json({ error: '...' }, { status: 429 });
  }

  // 3. Validate
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.issues },
      { status: 400 }
    );
  }

  // 4. Business logic
  const result = await createContactMessage(parsed.data);
  if (!result.success) {
    return NextResponse.json({ error: '...' }, { status: 500 });
  }

  // 5. Success
  return NextResponse.json({ success: true, messageId: result.messageId });
}
```

### Validation Pattern
```typescript
// src/components/contact/contact-form.tsx
const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

const handleBlur = (field: keyof ContactFormData): void => {
  const parsed = contactFormSchema.shape[field].safeParse(formData[field]);
  if (!parsed.success) {
    setFieldErrors(prev => ({
      ...prev,
      [field]: parsed.error.issues[0].message
    }));
  }
};

// In JSX:
<Input
  id="email"
  value={formData.email}
  onChange={(e) => handleChange('email', e.target.value)}
  onBlur={() => handleBlur('email')}
  aria-invalid={!!fieldErrors.email}
/>
{fieldErrors.email && (
  <p className="text-sm text-destructive">{fieldErrors.email}</p>
)}
```

## Notes

### User Preferences Applied
- Contact storage: Supabase database (not just email)
- Email delivery: Console logging only (no provider yet)
- Rate limiting: IP-based using existing infrastructure
- Validation: Both client-side (UX) and server-side (security)

### Future Enhancements
After this implementation, consider:
- [ ] Email provider integration (Resend recommended)
- [ ] Admin dashboard for viewing contact submissions
- [ ] Email notification when new message received
- [ ] Spam detection using user_agent and ip_address
- [ ] Export contact messages to CSV
