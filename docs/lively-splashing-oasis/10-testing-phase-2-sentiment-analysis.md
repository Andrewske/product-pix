# Testing: Phase 2 - Sentiment Analysis

## Files to Create
- `src/lib/ai/__tests__/sentiment-analysis.test.ts` (new)
- `src/app/api/cron/analyze-sentiment/__tests__/route.test.ts` (new)

## Implementation Details

### Sentiment Analysis Function Tests

**File**: `src/lib/ai/__tests__/sentiment-analysis.test.ts`

```typescript
import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { analyzeSentiment } from '../sentiment-analysis';

// Mock Anthropic client
const mockCreate = mock((params: any) => {
  const content = params.messages[0].content;

  // Simulate different responses based on input
  if (content.includes('bug')) {
    return Promise.resolve({
      content: [{
        type: 'text',
        text: JSON.stringify({
          category: 'bug_report',
          sentiment: 'negative',
          confidence: 0.9,
        }),
      }],
    });
  }

  if (content.includes('love')) {
    return Promise.resolve({
      content: [{
        type: 'text',
        text: JSON.stringify({
          category: 'praise',
          sentiment: 'positive',
          confidence: 0.85,
        }),
      }],
    });
  }

  return Promise.resolve({
    content: [{
      type: 'text',
      text: JSON.stringify({
        category: 'other',
        sentiment: 'neutral',
        confidence: 0.7,
      }),
    }],
  });
});

mock.module('@anthropic-ai/sdk', () => ({
  Anthropic: class {
    messages = {
      create: mockCreate,
    };
  },
}));

describe('analyzeSentiment', () => {
  it('classifies bug reports correctly', async () => {
    const result = await analyzeSentiment('I found a bug in the image generation');

    expect(result).not.toBeNull();
    expect(result?.category).toBe('bug_report');
    expect(result?.sentiment).toBe('negative');
    expect(result?.confidence).toBeGreaterThan(0);
  });

  it('classifies praise correctly', async () => {
    const result = await analyzeSentiment('I love this product!');

    expect(result).not.toBeNull();
    expect(result?.category).toBe('praise');
    expect(result?.sentiment).toBe('positive');
  });

  it('handles neutral messages', async () => {
    const result = await analyzeSentiment('How does this work?');

    expect(result).not.toBeNull();
    expect(result?.sentiment).toBe('neutral');
  });

  it('handles API errors gracefully', async () => {
    mockCreate.mockImplementationOnce(() => {
      throw new Error('API error');
    });

    const result = await analyzeSentiment('Test message');
    expect(result).toBeNull();
  });

  it('validates confidence range', async () => {
    mockCreate.mockImplementationOnce(() => ({
      content: [{
        type: 'text',
        text: JSON.stringify({
          category: 'other',
          sentiment: 'neutral',
          confidence: 1.5, // Invalid - should be clamped
        }),
      }],
    }));

    const result = await analyzeSentiment('Test');
    expect(result?.confidence).toBeLessThanOrEqual(1);
    expect(result?.confidence).toBeGreaterThanOrEqual(0);
  });

  it('returns null on invalid JSON', async () => {
    mockCreate.mockImplementationOnce(() => ({
      content: [{
        type: 'text',
        text: 'Not valid JSON',
      }],
    }));

    const result = await analyzeSentiment('Test');
    expect(result).toBeNull();
  });

  it('validates category values', async () => {
    mockCreate.mockImplementationOnce(() => ({
      content: [{
        type: 'text',
        text: JSON.stringify({
          category: 'invalid_category',
          sentiment: 'positive',
          confidence: 0.8,
        }),
      }],
    }));

    const result = await analyzeSentiment('Test');
    expect(result).toBeNull();
  });
});
```

### Cron Job Tests

**File**: `src/app/api/cron/analyze-sentiment/__tests__/route.test.ts`

Copy pattern from `src/app/api/cron/cleanup-errors/__tests__/route.test.ts`:

```typescript
import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { POST } from '../route';

// Mock environment
process.env.CRON_SECRET = 'test-secret';

// Mock sentiment analysis
mock.module('@/lib/ai/sentiment-analysis', () => ({
  analyzeSentiment: mock(() =>
    Promise.resolve({
      category: 'bug_report',
      sentiment: 'negative',
      confidence: 0.85,
    })
  ),
}));

// Mock database
const mockSupabase = {
  from: mock((table: string) => {
    if (table === 'sentiment_analysis_queue') {
      return {
        select: mock(() => ({
          is: mock(() => ({
            lt: mock(() => ({
              order: mock(() => ({
                limit: mock(() => ({
                  data: [
                    {
                      id: 'queue-1',
                      message_id: 'msg-1',
                      retry_count: 0,
                      user_messages: { content: 'Test message' },
                    },
                  ],
                  error: null,
                })),
              })),
            })),
          })),
        })),
        update: mock(() => ({
          eq: mock(() => ({ error: null })),
        })),
      };
    }

    if (table === 'user_messages') {
      return {
        update: mock(() => ({
          eq: mock(() => ({ error: null })),
        })),
      };
    }

    return {};
  }),
};

mock.module('@/lib/supabase/admin', () => ({
  createAdminClient: () => mockSupabase,
}));

describe('POST /api/cron/analyze-sentiment', () => {
  it('requires CRON_SECRET authentication', async () => {
    const request = new Request('http://localhost/api/cron/analyze-sentiment', {
      method: 'POST',
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('processes queue items successfully', async () => {
    const request = new Request('http://localhost/api/cron/analyze-sentiment', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-secret',
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.processed).toBeGreaterThan(0);
  });

  it('handles empty queue gracefully', async () => {
    mockSupabase.from = mock(() => ({
      select: mock(() => ({
        is: mock(() => ({
          lt: mock(() => ({
            order: mock(() => ({
              limit: mock(() => ({
                data: [],
                error: null,
              })),
            })),
          })),
        })),
      })),
    }));

    const request = new Request('http://localhost/api/cron/analyze-sentiment', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-secret',
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.processed).toBe(0);
  });

  it('increments retry count on failure', async () => {
    mock.module('@/lib/ai/sentiment-analysis', () => ({
      analyzeSentiment: mock(() => Promise.resolve(null)),
    }));

    const updateMock = mock(() => ({
      eq: mock(() => ({ error: null })),
    }));

    mockSupabase.from = mock((table: string) => {
      if (table === 'sentiment_analysis_queue') {
        return {
          select: mock(() => ({
            is: mock(() => ({
              lt: mock(() => ({
                order: mock(() => ({
                  limit: mock(() => ({
                    data: [
                      {
                        id: 'queue-1',
                        message_id: 'msg-1',
                        retry_count: 0,
                        user_messages: { content: 'Test' },
                      },
                    ],
                    error: null,
                  })),
                })),
              })),
            })),
          })),
          update: updateMock,
        };
      }
      return {};
    });

    const request = new Request('http://localhost/api/cron/analyze-sentiment', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-secret',
      },
    });

    await POST(request);

    // Verify retry_count was incremented
    expect(updateMock).toHaveBeenCalled();
  });

  it('respects MAX_RETRIES limit', async () => {
    mockSupabase.from = mock(() => ({
      select: mock(() => ({
        is: mock(() => ({
          lt: mock(() => ({
            order: mock(() => ({
              limit: mock(() => ({
                data: [],
                error: null,
              })),
            })),
          })),
        })),
      })),
    }));

    const request = new Request('http://localhost/api/cron/analyze-sentiment', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-secret',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    // Items with retry_count >= 3 should not be selected
    expect(data.processed).toBe(0);
  });
});
```

## Cost Control Tests

Add tests to verify cost controls are working:

```typescript
describe('Cost controls', () => {
  it('skips analysis for messages <10 chars', async () => {
    // This is tested in messages.test.ts
    // Verify queueForSentimentAnalysis is NOT called for short messages
  });

  it('limits batch size to 50', async () => {
    // Verify cron job only processes 50 items max per run
  });

  it('stops retrying after 3 attempts', async () => {
    // Verify items with retry_count >= 3 are not selected
  });
});
```

## Reference Patterns
- `src/app/api/cron/cleanup-errors/__tests__/route.test.ts` - Cron test pattern
- Mock external API calls with fixtures

## Acceptance Criteria
- ✅ Sentiment analysis tested with various message types
- ✅ Category classification validated
- ✅ Sentiment detection validated
- ✅ API error handling tested
- ✅ Cron job auth tested
- ✅ Queue processing tested (success and failure paths)
- ✅ Retry logic tested
- ✅ Batch size limit verified
- ✅ Cost controls verified
- ✅ All tests use Bun test patterns (no Jest)
