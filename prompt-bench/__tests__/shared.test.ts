import { describe, it, expect, beforeEach, mock } from 'bun:test';

// Mock the supabase client
mock.module('@/lib/supabase/admin', () => ({
  createAdminClient: mock(),
}));

let mockResult: { data: any; error: any } = { data: null, error: null };

const mockSupabase: any = {
  from: mock(() => ({
    select: mock(() => ({
      eq: mock(() => ({
        eq: mock(() => Promise.resolve(mockResult)),
      })),
    })),
  })),
};

describe('shared utilities', () => {
  let createAdminClient: any;
  let fetchBatchEvaluations: any;

  beforeEach(async () => {
    // Reset mocks
    mockResult = { data: null, error: null };

    // Dynamically import after mocking
    const adminModule = await import('@/lib/supabase/admin');
    createAdminClient = adminModule.createAdminClient;

    const sharedModule = await import('../commands/shared');
    fetchBatchEvaluations = sharedModule.fetchBatchEvaluations;

    // Setup mock implementation
    createAdminClient.mockReturnValue(mockSupabase);
  });

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

      mockResult = { data: mockData, error: null };

      const result = await fetchBatchEvaluations(mockSupabase, 'test-batch');

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

      mockResult = { data: mockData, error: null };

      const result = await fetchBatchEvaluations(mockSupabase, 'test-batch');

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
                // Missing other sub-scores
                reasoning: 'Partial evaluation',
              },
            },
          ],
        },
      ];

      mockResult = { data: mockData, error: null };

      const result = await fetchBatchEvaluations(mockSupabase, 'test-batch');

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
      mockResult = { data: null, error: mockError };

      await expect(fetchBatchEvaluations(mockSupabase, 'test-batch')).rejects.toThrow(
        'Failed to fetch evaluations for test-batch: Database connection failed'
      );
    });

    it('returns empty array when no data', async () => {
      mockResult = { data: null, error: null };

      const result = await fetchBatchEvaluations(mockSupabase, 'test-batch');

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

      mockResult = { data: mockData, error: null };

      const result = await fetchBatchEvaluations(mockSupabase, 'test-batch');

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
