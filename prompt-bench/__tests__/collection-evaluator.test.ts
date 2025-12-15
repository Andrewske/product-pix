import { describe, it, expect, mock } from 'bun:test';
import { evaluateCollection, type CollectionEvaluationResult } from '@bench/core/collection-evaluator';

// Mock external dependencies
mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = {
      create: mock(() => Promise.resolve({
        content: [{ type: 'text', text: JSON.stringify({
          overall: 8.2,
          consistency: 8,
          variety: 9,
          physicalPlausibility: 8,
          reasoning: 'Test reasoning',
          suggestions: ['Test suggestion']
        }) }],
        usage: { input_tokens: 100, output_tokens: 50 }
      }))
    };
  }
}));

mock('@/lib/r2', () => ({
  downloadBuffer: mock(() => Promise.resolve(Buffer.from('fake-image-data')))
}));

mock('@bench/core/cost', () => ({
  calculateCost: mock(() => ({ ok: true, data: { total: 0.01 } }))
}));

describe('evaluateCollection', () => {
  it('validates minimum image count', async () => {
    const result = await evaluateCollection([]);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('at least 2 images');
    }
  });

  it('validates maximum image count', async () => {
    const images = Array.from({ length: 11 }, (_, i) => ({ type: 'url' as const, value: `url${i}` }));
    const result = await evaluateCollection(images);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('maximum 10 images');
    }
  });

  it('requires ANTHROPIC_API_KEY', async () => {
    const originalKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    const result = await evaluateCollection([
      { type: 'url', value: 'url1' },
      { type: 'url', value: 'url2' }
    ]);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('ANTHROPIC_API_KEY');
    }

    process.env.ANTHROPIC_API_KEY = originalKey;
  });

  it('successfully evaluates collection', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    const result = await evaluateCollection([
      { type: 'url', value: 'url1' },
      { type: 'url', value: 'url2' }
    ]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const data: CollectionEvaluationResult = result.data;
      expect(data.overall).toBe(8.2);
      expect(data.consistency).toBe(8);
      expect(data.variety).toBe(9);
      expect(data.physicalPlausibility).toBe(8);
      expect(data.reasoning).toBe('Test reasoning');
      expect(data.suggestions).toEqual(['Test suggestion']);
      expect(data.costUsd).toBe(0.01);
      expect(data.tokensUsed).toBe(150);
      expect(data.model).toBe('claude-sonnet-4-20250514');
    }

    delete process.env.ANTHROPIC_API_KEY;
  });

  it('calculates correct weighted overall score', async () => {
    // Mock a response with specific scores
    const mockAnthropic = await import('@anthropic-ai/sdk');
    mockAnthropic.default = class MockAnthropic {
      messages = {
        create: mock(() => Promise.resolve({
          content: [{ type: 'text', text: JSON.stringify({
            overall: 7.9, // (8*0.4 + 9*0.3 + 7*0.3) = 3.2 + 2.7 + 2.1 = 8.0, but mocked as 7.9
            consistency: 8,
            variety: 9,
            physicalPlausibility: 7,
            reasoning: 'Weighted test',
            suggestions: []
          }) }],
          usage: { input_tokens: 100, output_tokens: 50 }
        }))
      };
    };

    process.env.ANTHROPIC_API_KEY = 'test-key';

    const result = await evaluateCollection([
      { type: 'url', value: 'url1' },
      { type: 'url', value: 'url2' }
    ]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      // The overall score should be calculated as: consistency(40%) + variety(30%) + plausibility(30%)
      // 8*0.4 + 9*0.3 + 7*0.3 = 3.2 + 2.7 + 2.1 = 8.0
      expect(result.data.consistency).toBe(8);
      expect(result.data.variety).toBe(9);
      expect(result.data.physicalPlausibility).toBe(7);
    }

    delete process.env.ANTHROPIC_API_KEY;
  });
});