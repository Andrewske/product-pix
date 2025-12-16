import { describe, it, expect, mock } from 'bun:test';
import { executeCollectionEvaluation } from '../commands/evaluate-collection';
import type { CollectionEvaluationResult } from '../core/collection-evaluator';

// Mock Supabase client
const createMockSupabase = () => {
  const mockUpdate = mock(() => ({
    eq: mock(() => Promise.resolve({ error: null }))
  }));

  const mockFrom = mock(() => ({
    update: mockUpdate
  }));

  return {
    from: mockFrom
  };
};

describe('executeCollectionEvaluation', () => {
  it('successfully updates all evaluations', async () => {
    const mockSupabase = createMockSupabase();
    const validImages = [
      { id: 'test-1', image_url: 'url1', final_prompt: 'prompt1' },
      { id: 'test-2', image_url: 'url2', final_prompt: 'prompt2' }
    ];

    const evaluationResult: CollectionEvaluationResult = {
      overall: 8.5,
      consistency: 8,
      variety: 9,
      physicalPlausibility: 8,
      reasoning: 'Test reasoning',
      suggestions: ['Suggestion 1', 'Suggestion 2'],
      model: 'claude-sonnet-4-20250514',
      costUsd: 0.02,
      tokensUsed: 200
    };

    const result = await executeCollectionEvaluation(mockSupabase as any, validImages, evaluationResult);

    expect(result.ok).toBe(true);
    expect(mockSupabase.from).toHaveBeenCalledWith('prompt_evaluations');
    expect(mockSupabase.from().update).toHaveBeenCalledTimes(2);
  });

  it('handles database update errors', async () => {
    const mockSupabaseWithError = {
      from: mock(() => ({
        update: mock(() => ({
          eq: mock(() => Promise.resolve({
            error: { message: 'Database connection failed' }
          }))
        }))
      }))
    };

    const validImages = [
      { id: 'test-1', image_url: 'url1', final_prompt: 'prompt1' }
    ];

    const evaluationResult: CollectionEvaluationResult = {
      overall: 8.5,
      consistency: 8,
      variety: 9,
      physicalPlausibility: 8,
      reasoning: 'Test reasoning',
      suggestions: ['Suggestion 1'],
      model: 'claude-sonnet-4-20250514',
      costUsd: 0.01,
      tokensUsed: 100
    };

    const result = await executeCollectionEvaluation(mockSupabaseWithError as any, validImages, evaluationResult);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('database');
      expect(result.error.message).toContain('Failed to update evaluation for test test-1');
      expect(result.error.message).toContain('Database connection failed');
      expect(result.error.location).toBe('executeCollectionEvaluation.updateEvaluation');
    }
  });

  it('distributes cost and tokens correctly across multiple images', async () => {
    const mockSupabase = createMockSupabase();
    const validImages = [
      { id: 'test-1', image_url: 'url1', final_prompt: 'prompt1' },
      { id: 'test-2', image_url: 'url2', final_prompt: 'prompt2' },
      { id: 'test-3', image_url: 'url3', final_prompt: 'prompt3' }
    ];

    const evaluationResult: CollectionEvaluationResult = {
      overall: 7.5,
      consistency: 7,
      variety: 8,
      physicalPlausibility: 7,
      reasoning: 'Test reasoning',
      suggestions: ['Suggestion 1'],
      model: 'claude-sonnet-4-20250514',
      costUsd: 0.03,
      tokensUsed: 300
    };

    const result = await executeCollectionEvaluation(mockSupabase as any, validImages, evaluationResult);

    expect(result.ok).toBe(true);
    expect(mockSupabase.from().update).toHaveBeenCalledTimes(3);
  });

  it('handles empty image array', async () => {
    const mockSupabase = createMockSupabase();
    const evaluationResult: CollectionEvaluationResult = {
      overall: 8.0,
      consistency: 8,
      variety: 8,
      physicalPlausibility: 8,
      reasoning: 'Test reasoning',
      suggestions: [],
      model: 'claude-sonnet-4-20250514',
      costUsd: 0.01,
      tokensUsed: 100
    };

    const result = await executeCollectionEvaluation(mockSupabase as any, [], evaluationResult);

    expect(result.ok).toBe(true);
    expect(mockSupabase.from().update).not.toHaveBeenCalled();
  });
});