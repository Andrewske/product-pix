import { validateBatchSize } from '../commands/improve';

// Mock the entire shared module to avoid complex mocking
jest.mock('../commands/shared', () => ({
  fetchBatchEvaluations: jest.fn(),
}));

const mockFetchBatchEvaluations = require('../commands/shared').fetchBatchEvaluations;

describe('validateBatchSize', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return success for batch with 5 or more evaluations', async () => {
    const mockData = [
      { testId: '1', score: 7.5, details: {} },
      { testId: '2', score: 6.8, details: {} },
      { testId: '3', score: 8.2, details: {} },
      { testId: '4', score: 7.1, details: {} },
      { testId: '5', score: 6.9, details: {} },
    ];
    
    mockFetchBatchEvaluations.mockResolvedValue(mockData);
    
    const result = await validateBatchSize('test-batch', false);
    
    expect(result.ok).toBe(true);
  });

  it('should return error for batch with fewer than 5 evaluations', async () => {
    const mockData = [
      { testId: '1', score: 7.5, details: {} },
      { testId: '2', score: 6.8, details: {} },
      { testId: '3', score: 8.2, details: {} },
    ];

    mockFetchBatchEvaluations.mockResolvedValue(mockData);

    const result = await validateBatchSize('test-batch', false);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('has only 3 completed evaluations');
    }
  });

  it('should allow small batches when force is true', async () => {
    const mockData = [
      { testId: '1', score: 7.5, details: {} },
    ];
    
    mockFetchBatchEvaluations.mockResolvedValue(mockData);
    
    const result = await validateBatchSize('test-batch', true);
    
    expect(result.ok).toBe(true);
  });

  it('should handle empty batch results', async () => {
    mockFetchBatchEvaluations.mockResolvedValue([]);

    const result = await validateBatchSize('test-batch', false);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('has only 0 completed evaluations');
    }
  });
});
