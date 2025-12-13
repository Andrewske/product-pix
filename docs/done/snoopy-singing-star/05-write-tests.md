# Write Comprehensive Tests

## Overview
Create unit tests for email service, templates, and update contact API tests to verify email integration.

## Files to Modify/Create
- `src/lib/email/__tests__/resend.test.ts` (create new)
- `src/lib/email/__tests__/templates.test.ts` (create new)
- `src/app/api/contact/__tests__/route.test.ts` (modify existing)

## Implementation Details

### File: `src/lib/email/__tests__/resend.test.ts`

Test the core email service module with mocked Resend SDK.

**Test Cases:**
- ✓ Sends email successfully
- ✓ Handles multiple recipients
- ✓ Includes replyTo if provided
- ✓ Returns error when Resend API fails
- ✓ Skips sending when EMAIL_ENABLED is false
- ✓ Handles unexpected errors

**Mock Setup:**
```typescript
import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { sendEmail } from '../resend';

const mockEmailsSend = mock(() => Promise.resolve({
  data: { id: 'email-123' },
  error: null,
}));

mock.module('resend', () => ({
  Resend: class {
    emails = { send: mockEmailsSend };
  },
}));

mock.module('@/lib/env', () => ({
  env: {
    RESEND_API_KEY: 're_test_key',
    RESEND_FROM_EMAIL: 'test@example.com',
    EMAIL_ENABLED: 'true',
  },
}));

const mockLoggerInfo = mock(() => {});
const mockLoggerError = mock(() => {});

mock.module('@/lib/logging', () => ({
  logger: {
    info: mockLoggerInfo,
    error: mockLoggerError,
  },
}));
```

### File: `src/lib/email/__tests__/templates.test.ts`

Test email template rendering and XSS protection.

**Test Cases:**
- ✓ Renders admin notification with all details
- ✓ Escapes HTML in message (XSS prevention)
- ✓ Renders user acknowledgment with name
- ✓ Includes app URL from environment

**Critical XSS Test:**
```typescript
it('should escape HTML in message', () => {
  const html = renderContactAdminNotification({
    name: 'Test',
    email: 'test@example.com',
    message: '<script>alert("XSS")</script>',
    submittedAt: '2025-01-15T10:30:00Z',
  });

  // Should NOT contain raw script tag
  expect(html).not.toContain('<script>alert("XSS")</script>');
  // Should contain escaped version
  expect(html).toContain('&lt;script&gt;');
});
```

### File: `src/app/api/contact/__tests__/route.test.ts` (update existing)

Add email integration tests to existing contact API tests.

**New Test Cases:**
- ✓ Sends admin notification email on success
- ✓ Sends user acknowledgment email on success
- ✓ Succeeds even if admin email fails
- ✓ Succeeds even if both emails fail

**Mock Setup:**
```typescript
const mockSendEmail = mock(() => Promise.resolve({
  success: true,
  emailId: 'test-email-id'
}));

const mockRenderAdminNotification = mock(() => '<html>Admin email</html>');
const mockRenderUserAcknowledgment = mock(() => '<html>User email</html>');

mock.module('@/lib/email', () => ({
  sendEmail: mockSendEmail,
  renderContactAdminNotification: mockRenderAdminNotification,
  renderContactUserAcknowledgment: mockRenderUserAcknowledgment,
}));
```

**Critical Test - Graceful Degradation:**
```typescript
it('should succeed even if both emails fail', async () => {
  mockSendEmail.mockResolvedValue({ success: false, error: 'Service down' });

  const response = await POST(mockRequest);

  expect(response.status).toBe(200);  // Still succeeds
  expect(mockLoggerWarn).toHaveBeenCalledTimes(2);  // Both failures logged
});
```

## Acceptance Criteria
- ✓ All new tests pass
- ✓ All existing tests still pass
- ✓ Coverage remains above 70% for email module
- ✓ XSS protection verified
- ✓ Graceful degradation tested (emails fail, API succeeds)
- ✓ Mocks prevent real emails during testing

## Dependencies
- Task 01: Install dependencies and setup environment variables
- Task 02: Create email service module
- Task 03: Create email templates
- Task 04: Integrate email into contact API

## Running Tests

```bash
# Test email module only
bun test src/lib/email

# Test contact API
bun test src/app/api/contact

# All tests
bun test

# With coverage
bun test --coverage
```

Target: 70-80% coverage
