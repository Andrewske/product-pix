import { describe, it, expect } from 'bun:test';
import { mock } from 'bun:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types';

const mockCreateAdminClient = mock();

mock.module('@/lib/supabase/admin', () => ({
  createAdminClient: mockCreateAdminClient,
}));

const { fetchBatchEvaluations } = await import('../commands/shared');

interface MockQueryResult {
  data: unknown;
  error: unknown;
}

interface MockSupabaseClient {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: unknown) => {
        eq: (column: string, value: unknown) => Promise<MockQueryResult>;
      };
    };
  };
}

const createMockSupabase = (result: MockQueryResult): SupabaseClient<Database> => {
  const mockClient: MockSupabaseClient = {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => Promise.resolve(result),
        }),
      }),
    }),
  };
  return mockClient as unknown as SupabaseClient<Database>;
};

describe('shared utilities', () => {
  describe('fetchBatchEvaluations', () => {
    it('fetches evaluation details for a batch', async () => {
      const mockData = [
        {
          id: 'test-1',
          prompt_evaluations: [
            {
              score_overall: 8.5,
              details: {
                composition: 8,
                lighting: 9,
                productVisibility: 8,
                backgroundQuality: 9,
                professionalQuality: 8,
                promptAdherence: 9,
                reasoning: 'Good overall quality',
                suggestions: ['Improve lighting contrast'],
              },
            },
          ],
        },
        {
          id: 'test-2',
          prompt_evaluations: [
            {
              score_overall: 7.2,
              details: {
                composition: 7,
                lighting: 7,
                productVisibility: 8,
                backgroundQuality: 7,
                professionalQuality: 7,
                promptAdherence: 8,
                reasoning: 'Decent quality but could be better',
                suggestions: ['Add more shadows', 'Improve background'],
              },
            },
          ],
        },
      ];

      const supabase = createMockSupabase({ data: mockData, error: null });

      const result = await fetchBatchEvaluations(supabase, 'test-batch');

      expect(result).toEqual([
        {
          testId: 'test-1',
          score: 8.5,
          details: {
            composition: 8,
            lighting: 9,
            productVisibility: 8,
            backgroundQuality: 9,
            professionalQuality: 8,
            promptAdherence: 9,
            reasoning: 'Good overall quality',
            suggestions: ['Improve lighting contrast'],
          },
        },
        {
          testId: 'test-2',
          score: 7.2,
          details: {
            composition: 7,
            lighting: 7,
            productVisibility: 8,
            backgroundQuality: 7,
            professionalQuality: 7,
            promptAdherence: 8,
            reasoning: 'Decent quality but could be better',
            suggestions: ['Add more shadows', 'Improve background'],
          },
        },
      ]);
    });

    it('handles tests without evaluations', async () => {
      const mockData = [
        {
          id: 'test-1',
          prompt_evaluations: null,
        },
        {
          id: 'test-2',
          prompt_evaluations: [],
        },
        {
          id: 'test-3',
          prompt_evaluations: [
            {
              score_overall: null,
              details: null,
            },
          ],
        },
      ];

      const supabase = createMockSupabase({ data: mockData, error: null });

      const result = await fetchBatchEvaluations(supabase, 'test-batch');

      expect(result).toEqual([]);
    });

    it('handles partial evaluation details', async () => {
      const mockData = [
        {
          id: 'test-1',
          prompt_evaluations: [
            {
              score_overall: 6.5,
              details: {
                composition: 7,
                lighting: 6,
                reasoning: 'Partial evaluation',
              },
            },
          ],
        },
      ];

      const supabase = createMockSupabase({ data: mockData, error: null });

      const result = await fetchBatchEvaluations(supabase, 'test-batch');

      expect(result).toEqual([
        {
          testId: 'test-1',
          score: 6.5,
          details: {
            composition: 7,
            lighting: 6,
            reasoning: 'Partial evaluation',
          },
        },
      ]);
    });

    it('throws error on database error', async () => {
      const mockError = { message: 'Database connection failed' };
      const supabase = createMockSupabase({ data: null, error: mockError });

      try {
        await fetchBatchEvaluations(supabase, 'test-batch');
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect((error as Error).message).toContain('Failed to fetch evaluations for test-batch: Database connection failed');
      }
    });

    it('returns empty array when no data', async () => {
      const supabase = createMockSupabase({ data: null, error: null });

      const result = await fetchBatchEvaluations(supabase, 'test-batch');

      expect(result).toEqual([]);
    });

    it('filters out tests with null evaluations array', async () => {
      const mockData = [
        {
          id: 'test-1',
          prompt_evaluations: [
            {
              score_overall: 8.0,
              details: { composition: 8 },
            },
          ],
        },
        {
          id: 'test-2',
          prompt_evaluations: null,
        },
      ];

      const supabase = createMockSupabase({ data: mockData, error: null });

      const result = await fetchBatchEvaluations(supabase, 'test-batch');

      expect(result).toEqual([
        {
          testId: 'test-1',
          score: 8.0,
          details: { composition: 8 },
        },
      ]);
    });
  });
});
