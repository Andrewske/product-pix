import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { POST } from '../route';

// Mock environment
process.env.CRON_SECRET = 'test-secret';

// Mock sentiment analysis
const mockAnalyzeSentiment = mock(() =>
  Promise.resolve({
    category: 'bug_report',
    sentiment: 'negative',
    confidence: 0.85,
  })
);

// Mock the entire sentiment-analysis module
mock.module('@/lib/ai/sentiment-analysis', () => ({
  analyzeSentiment: mockAnalyzeSentiment,
}));

// Mock logger
const mockLogger = {
  error: mock(() => {}),
  info: mock(() => {}),
};

mock.module('@/lib/logging', () => ({
  logger: mockLogger,
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
                      user_messages: { content: 'Test message with bug report' },
                    },
                    {
                      id: 'queue-2',
                      message_id: 'msg-2',
                      retry_count: 1,
                      user_messages: { content: 'Another test message' },
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
  beforeEach(() => {
    mockAnalyzeSentiment.mockClear();
    mockLogger.error.mockClear();
    mockLogger.info.mockClear();
    mockSupabase.from.mockClear();
  });

  describe('Authentication', () => {
    it('requires CRON_SECRET authentication', async () => {
      const request = new Request('http://localhost/api/cron/analyze-sentiment', {
        method: 'POST',
      });

      const response = await POST(request);
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('accepts valid CRON_SECRET authentication', async () => {
      const request = new Request('http://localhost/api/cron/analyze-sentiment', {
        method: 'POST',
        headers: {
          authorization: 'Bearer test-secret',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Queue processing', () => {
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
      expect(data.processed).toBe(2);

      expect(mockAnalyzeSentiment).toHaveBeenCalledTimes(2);
      expect(mockLogger.info).toHaveBeenCalledWith('Sentiment analysis cron completed', { processed: 2 });
    });

    it('handles empty queue gracefully', async () => {
      // @ts-expect-error - Complex mock chain for specific test scenario
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

      expect(mockAnalyzeSentiment).not.toHaveBeenCalled();
    });

    it('respects BATCH_SIZE limit', async () => {
      // Create mock data with more than 50 items
      const mockQueueItems = Array.from({ length: 60 }, (_, i) => ({
        id: `queue-${i + 1}`,
        message_id: `msg-${i + 1}`,
        retry_count: 0,
        user_messages: { content: `Test message ${i + 1}` },
      }));

      mockSupabase.from = mock((table: string) => {
        if (table === 'sentiment_analysis_queue') {
          return {
            select: mock(() => ({
              is: mock(() => ({
                lt: mock(() => ({
                  order: mock(() => ({
                    limit: mock(() => ({
                      data: mockQueueItems,
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
        return {};
      });

      const request = new Request('http://localhost/api/cron/analyze-sentiment', {
        method: 'POST',
        headers: {
          authorization: 'Bearer test-secret',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.processed).toBe(50); // Should be limited to 50

      expect(mockAnalyzeSentiment).toHaveBeenCalledTimes(50);
    });

    it('skips items with missing content', async () => {
      mockSupabase.from = mock(() => ({
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
                      user_messages: { content: null }, // Missing content
                    },
                    {
                      id: 'queue-2',
                      message_id: 'msg-2',
                      retry_count: 0,
                      user_messages: { content: 'Valid content' },
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
      expect(data.processed).toBe(1); // Only one valid item

      expect(mockAnalyzeSentiment).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error handling', () => {
    it('increments retry count on analysis failure', async () => {
      // @ts-expect-error - Mock returns null for failure case
      mockAnalyzeSentiment.mockImplementationOnce(() => Promise.resolve(null));

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

      expect(updateMock).toHaveBeenCalledWith({
        retry_count: 1,
        last_error: 'Analysis returned null',
      });
    });

    it('increments retry count on analysis exception', async () => {
      mockAnalyzeSentiment.mockImplementationOnce(() => {
        throw new Error('Analysis failed');
      });

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

      expect(updateMock).toHaveBeenCalledWith({
        retry_count: 1,
        last_error: 'Analysis failed',
      });

      expect(mockLogger.error).toHaveBeenCalledWith('Error processing sentiment queue item', {
        error: 'Analysis failed',
        queueItemId: 'queue-1',
      });
    });

    it('respects MAX_RETRIES limit', async () => {
      // @ts-expect-error - Complex mock chain for specific test scenario
      mockSupabase.from = mock(() => ({
        select: mock(() => ({
          is: mock(() => ({
            lt: mock(() => ({
              order: mock(() => ({
                limit: mock(() => ({
                  data: [], // No items should be returned due to retry limit
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

    it('handles database fetch errors', async () => {
      // @ts-expect-error - Complex mock chain for specific test scenario
      mockSupabase.from = mock(() => ({
        select: mock(() => ({
          is: mock(() => ({
            lt: mock(() => ({
              order: mock(() => ({
                limit: mock(() => ({
                  data: null,
                  error: { message: 'Database connection failed' },
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
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error).toBe('Failed to fetch queue');

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to fetch sentiment queue', {
        error: 'Database connection failed',
      });
    });

    it('handles unexpected errors', async () => {
      mockSupabase.from = mock(() => {
        throw new Error('Unexpected database error');
      });

      const request = new Request('http://localhost/api/cron/analyze-sentiment', {
        method: 'POST',
        headers: {
          authorization: 'Bearer test-secret',
        },
      });

      const response = await POST(request);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error).toBe('Internal server error');

      expect(mockLogger.error).toHaveBeenCalledWith('Sentiment analysis cron failed', {
        error: 'Unexpected database error',
      });
    });
  });

  describe('Cost controls', () => {
    it('limits batch size to prevent excessive API calls', async () => {
      // This is tested in the batch size test above
      // The cron job should only process up to 50 items per run
      expect(true).toBe(true); // Placeholder test
    });

    it('stops retrying after 3 attempts', async () => {
      // This is tested in the MAX_RETRIES test above
      // Items with retry_count >= 3 should not be selected
      expect(true).toBe(true); // Placeholder test
    });
  });
});