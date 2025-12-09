/**
 * Tests for improve command validation functions
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock dependencies
jest.mock('@/lib/supabase/admin');
jest.mock('../commands/shared');

const mockCreateAdminClient = jest.mocked(require('@/lib/supabase/admin').createAdminClient);
const mockFetchBatchEvaluations = jest.mocked(require('../commands/shared').fetchBatchEvaluations);

// Import after mocking
import { validateBatchSize } from '../commands/improve';

describe('validateBatchSize', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = {};
    mockCreateAdminClient.mockReturnValue(mockSupabase);
  });

  it('returns success when batch has exactly 5 evaluations', async () => {
    const evaluations = [
      { testId: '1', score: 8.0, details: {} },
      { testId: '2', score: 7.5, details: {} },
      { testId: '3', score: 9.0, details: {} },
      { testId: '4', score: 8.5, details: {} },
      { testId: '5', score: 7.0, details: {} },
    ];
    mockFetchBatchEvaluations.mockResolvedValue(evaluations);

    const result = await validateBatchSize('test-batch', false);

    expect(result.ok).toBe(true);
    expect(mockFetchBatchEvaluations).toHaveBeenCalledWith(mockSupabase, 'test-batch');
  });

  it('returns success when batch has more than 5 evaluations', async () => {
    const evaluations = Array.from({ length: 10 }, (_, i) => ({
      testId: `${i + 1}`,
      score: 8.0 + Math.random(),
      details: {}
    }));
    mockFetchBatchEvaluations.mockResolvedValue(evaluations);

    const result = await validateBatchSize('test-batch', false);

    expect(result.ok).toBe(true);
  });

  it('returns error when batch has fewer than 5 evaluations without force', async () => {
    const evaluations = [
      { testId: '1', score: 8.0, details: {} },
      { testId: '2', score: 7.5, details: {} },
      { testId: '3', score: 9.0, details: {} },
    ];
    mockFetchBatchEvaluations.mockResolvedValue(evaluations);

    const result = await validateBatchSize('test-batch', false);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('has only 3 completed evaluations');
      expect(result.error.message).toContain('Minimum 5 required');
      expect(result.error.message).toContain('Use --force to override');
    }
  });

  it('returns success with warning when batch has fewer than 5 evaluations with force', async () => {
    const evaluations = [
      { testId: '1', score: 8.0, details: {} },
      { testId: '2', score: 7.5, details: {} },
    ];
    mockFetchBatchEvaluations.mockResolvedValue(evaluations);

    // Mock console.warn
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await validateBatchSize('test-batch', true);

    expect(result.ok).toBe(true);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Warning: Batch 'test-batch' has only 2 evaluations")
    );
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Proceeding with --force")
    );

    consoleWarnSpy.mockRestore();
  });

  it('returns success when batch has exactly 0 evaluations with force', async () => {
    mockFetchBatchEvaluations.mockResolvedValue([]);

    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await validateBatchSize('empty-batch', true);

    expect(result.ok).toBe(true);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Warning: Batch 'empty-batch' has only 0 evaluations")
    );

    consoleWarnSpy.mockRestore();
  });

  it('handles database errors gracefully', async () => {
    mockFetchBatchEvaluations.mockRejectedValue(new Error('Database connection failed'));

    await expect(validateBatchSize('test-batch', false)).rejects.toThrow('Database connection failed');
  });
});