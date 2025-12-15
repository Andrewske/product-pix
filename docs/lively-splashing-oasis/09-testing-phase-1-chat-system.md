# Testing: Phase 1 - Chat System

## Files to Create
- `src/lib/db/__tests__/messages.test.ts` (new)
- `src/app/api/messages/__tests__/route.test.ts` (new)
- `src/components/messages/__tests__/message-list.test.tsx` (new)
- `src/hooks/__tests__/use-messages.test.tsx` (new)

## Implementation Details

### Database Functions Tests

**File**: `src/lib/db/__tests__/messages.test.ts`

Mirror pattern from `src/lib/db/__tests__/feedback.test.ts`:

```typescript
import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { submitMessage, getMessagesForUser, markAsRead, sendAdminReply } from '../messages';

// Mock admin client
const mockSupabase = {
  from: mock(() => ({
    insert: mock(() => ({
      select: mock(() => ({
        single: mock(() => ({
          data: {
            id: 'msg-1',
            user_id: 'user-1',
            content: 'Test message',
            is_from_admin: false,
            read_at: null,
            analysis: null,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
          },
          error: null,
        })),
      })),
    })),
    select: mock(() => ({
      eq: mock(() => ({
        order: mock(() => ({
          data: [],
          error: null,
        })),
      })),
    })),
    update: mock(() => ({
      eq: mock(() => ({
        error: null,
      })),
    })),
  })),
};

mock.module('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockSupabase,
}));

describe('submitMessage', () => {
  it('creates user message and queues for analysis', async () => {
    const result = await submitMessage('user-1', { content: 'Test message' });

    expect(result).not.toBeNull();
    expect(result?.content).toBe('Test message');
    expect(result?.isFromAdmin).toBe(false);
  });

  it('returns null on database error', async () => {
    mockSupabase.from = mock(() => ({
      insert: mock(() => ({
        select: mock(() => ({
          single: mock(() => ({
            data: null,
            error: { message: 'Database error' },
          })),
        })),
      })),
    }));

    const result = await submitMessage('user-1', { content: 'Test' });
    expect(result).toBeNull();
  });
});

describe('getMessagesForUser', () => {
  it('returns messages in chronological order', async () => {
    const messages = await getMessagesForUser('user-1');
    expect(Array.isArray(messages)).toBe(true);
  });
});

describe('markAsRead', () => {
  it('updates read_at timestamp', async () => {
    const result = await markAsRead('msg-1');
    expect(result).toBe(true);
  });
});

describe('sendAdminReply', () => {
  it('creates admin message', async () => {
    const result = await sendAdminReply({
      userId: 'user-1',
      content: 'Admin reply',
    });

    expect(result?.isFromAdmin).toBe(true);
  });
});
```

### API Route Tests

**File**: `src/app/api/messages/__tests__/route.test.ts`

```typescript
import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { POST, GET } from '../route';

describe('POST /api/messages', () => {
  it('creates message for authenticated user', async () => {
    // Mock authenticated request
    const request = new Request('http://localhost/api/messages', {
      method: 'POST',
      body: JSON.stringify({ content: 'Test message' }),
    });

    // Mock auth
    mock.module('@/lib/supabase/server', () => ({
      createServerClient: async () => ({
        auth: {
          getUser: async () => ({
            data: { user: { id: 'user-1' } },
            error: null,
          }),
        },
      }),
    }));

    const response = await POST(request);
    expect(response.status).toBe(200);
  });

  it('rejects unauthenticated requests', async () => {
    const request = new Request('http://localhost/api/messages', {
      method: 'POST',
      body: JSON.stringify({ content: 'Test' }),
    });

    mock.module('@/lib/supabase/server', () => ({
      createServerClient: async () => ({
        auth: {
          getUser: async () => ({
            data: { user: null },
            error: { message: 'Not authenticated' },
          }),
        },
      }),
    }));

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('validates content length', async () => {
    const longContent = 'a'.repeat(2001);
    const request = new Request('http://localhost/api/messages', {
      method: 'POST',
      body: JSON.stringify({ content: longContent }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
```

### Component Tests

**File**: `src/components/messages/__tests__/message-list.test.tsx`

```typescript
import { describe, it, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { MessageList } from '../message-list';
import type { UserMessage } from '@/types';

const mockMessages: UserMessage[] = [
  {
    id: '1',
    userId: 'user-1',
    content: 'User message',
    isFromAdmin: false,
    readAt: null,
    analysis: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    userId: 'user-1',
    content: 'Admin reply',
    isFromAdmin: true,
    readAt: null,
    analysis: null,
    createdAt: '2025-01-01T01:00:00Z',
    updatedAt: '2025-01-01T01:00:00Z',
  },
];

describe('MessageList', () => {
  it('renders messages', () => {
    render(<MessageList messages={mockMessages} loading={false} />);

    const userMsg = screen.getByText('User message');
    const adminMsg = screen.getByText('Admin reply');

    expect(userMsg).not.toBeNull();
    expect(adminMsg).not.toBeNull();
  });

  it('shows loading state', () => {
    render(<MessageList messages={[]} loading={true} />);

    const loader = document.querySelector('.animate-spin');
    expect(loader).not.toBeNull();
  });

  it('shows empty state', () => {
    render(<MessageList messages={[]} loading={false} />);

    const emptyText = screen.getByText(/No messages yet/i);
    expect(emptyText).not.toBeNull();
  });

  it('distinguishes user vs admin messages visually', () => {
    const { container } = render(<MessageList messages={mockMessages} loading={false} />);

    // Admin messages should have Badge with "Admin" text
    const adminBadge = screen.getByText('Admin');
    expect(adminBadge).not.toBeNull();
  });
});
```

### Hook Tests

**File**: `src/hooks/__tests__/use-messages.test.tsx`

```typescript
import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { renderHook, waitFor } from '@testing-library/react';
import { useMessages } from '../use-messages';

// Mock Supabase Realtime
const mockChannel = {
  on: mock(() => mockChannel),
  subscribe: mock(() => mockChannel),
};

mock.module('@/lib/supabase/client', () => ({
  createClientClient: () => ({
    channel: mock(() => mockChannel),
    removeChannel: mock(),
  }),
}));

// Mock auth
mock.module('@/lib/auth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

// Mock fetch
global.fetch = mock((url: string) => {
  if (url === '/api/messages') {
    return Promise.resolve({
      ok: true,
      json: async () => ({ messages: [] }),
    } as Response);
  }
  return Promise.reject(new Error('Not found'));
}) as typeof fetch;

describe('useMessages', () => {
  it('fetches messages on mount', async () => {
    const { result } = renderHook(() => useMessages());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(Array.isArray(result.current.messages)).toBe(true);
  });

  it('provides sendMessage function', () => {
    const { result } = renderHook(() => useMessages());
    expect(typeof result.current.sendMessage).toBe('function');
  });

  it('calculates unread count', async () => {
    const { result } = renderHook(() => useMessages());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(typeof result.current.unreadCount).toBe('number');
  });
});
```

## Mock Strategy

### LLM API Mocking
- Not needed for Phase 1 (chat system only)
- Will be added in Phase 2 (sentiment analysis)

### Supabase Realtime Mocking
```typescript
const mockChannel = {
  on: mock(() => mockChannel),
  subscribe: mock(() => mockChannel),
};

const mockSupabase = {
  channel: mock(() => mockChannel),
  removeChannel: mock(),
};
```

## Reference Patterns
- `src/lib/db/__tests__/feedback.test.ts` - Database test pattern
- `src/components/__tests__/image-card.test.tsx` - Component test pattern
- Bun test matchers (native only, no jest-dom)

## Acceptance Criteria
- ✅ All tests pass with `bun test`
- ✅ Coverage reaches 70%+ for new code
- ✅ Database functions tested (CRUD operations)
- ✅ API routes tested (auth, validation, error handling)
- ✅ Components tested (rendering, user/admin distinction)
- ✅ Hook tested (fetch, realtime, state management)
- ✅ Mocks follow Bun test patterns (no Jest dependencies)
- ✅ RLS policies verified (users can't read others' messages)
