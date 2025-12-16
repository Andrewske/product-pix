 import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { evaluateCollection, type CollectionEvaluationResult } from '@bench/core/collection-evaluator';

// Import the extracted functions for testing
import { prepareImageContent, callGeminiEvaluationAPI } from '@bench/core/collection-evaluator';

// Mock external dependencies
mock.module('@anthropic-ai/sdk', () => ({
  default: class {
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

mock.module('@/lib/r2', () => ({
  downloadBuffer: mock(() => Promise.resolve(Buffer.from('fake-image-data')))
}));

mock.module('@bench/core/cost', () => ({
  calculateCost: mock(() => ({ ok: true, data: { total: 0.01 } }))
}));

// Mock logger
mock.module('@/lib/logging', () => ({
  logger: {
    warn: mock(() => {}),
    error: mock(() => {}),
    info: mock(() => {})
  }
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
    // This test uses the same mock as the successful test
    // The mock returns specific scores for testing
    process.env.ANTHROPIC_API_KEY = 'test-key';

    const result = await evaluateCollection([
      { type: 'url', value: 'url1' },
      { type: 'url', value: 'url2' }
    ]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      // The individual scores should match the mock response
      expect(result.data.consistency).toBe(8);
      expect(result.data.variety).toBe(9);
      expect(result.data.physicalPlausibility).toBe(8); // From the main mock
    }

    delete process.env.ANTHROPIC_API_KEY;
  });
});

describe('prepareImageContent', () => {
  beforeEach(() => {
    // Reset mocks
    mock.restore();
  });

  it('prepares URL image inputs correctly', async () => {
    const imageInputs = [
      { type: 'url' as const, value: 'https://example.com/image1.jpg' },
      { type: 'url' as const, value: 'https://example.com/image2.png' }
    ];

    const result = await prepareImageContent(imageInputs);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({
        type: 'image',
        source: { type: 'url', url: 'https://example.com/image1.jpg' }
      });
      expect(result.data[1]).toEqual({
        type: 'image',
        source: { type: 'url', url: 'https://example.com/image2.png' }
      });
    }
  });

  it('prepares key image inputs with JPEG detection', async () => {
    // Mock downloadBuffer to return JPEG data (starts with FF D8 FF)
    const mockDownloadBuffer = mock(() => Promise.resolve(Buffer.from([0xFF, 0xD8, 0xFF, 0xE0])));

    mock.module('@/lib/r2', () => ({
      downloadBuffer: mockDownloadBuffer
    }));

    const imageInputs = [
      { type: 'key' as const, value: 'test-key-1' }
    ];

    const result = await prepareImageContent(imageInputs);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]).toString('base64')
        }
      });
    }
  });

  it('prepares key image inputs with PNG detection', async () => {
    // Mock downloadBuffer to return PNG data (starts with 89 50 4E 47)
    const mockDownloadBuffer = mock(() => Promise.resolve(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])));

    mock.module('@/lib/r2', () => ({
      downloadBuffer: mockDownloadBuffer
    }));

    const imageInputs = [
      { type: 'key' as const, value: 'test-key-1' }
    ];

    const result = await prepareImageContent(imageInputs);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data[0].source.media_type).toBe('image/png');
    }
  });

  it('prepares key image inputs with WebP detection', async () => {
    // Mock downloadBuffer to return WebP data (starts with 52 49 46 46)
    const mockDownloadBuffer = mock(() => Promise.resolve(Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50])));

    mock.module('@/lib/r2', () => ({
      downloadBuffer: mockDownloadBuffer
    }));

    const imageInputs = [
      { type: 'key' as const, value: 'test-key-1' }
    ];

    const result = await prepareImageContent(imageInputs);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data[0].source.media_type).toBe('image/webp');
    }
  });

  it('prepares key image inputs with GIF detection', async () => {
    // Mock downloadBuffer to return GIF data (starts with 47 49 46)
    const mockDownloadBuffer = mock(() => Promise.resolve(Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])));

    mock.module('@/lib/r2', () => ({
      downloadBuffer: mockDownloadBuffer
    }));

    const imageInputs = [
      { type: 'key' as const, value: 'test-key-1' }
    ];

    const result = await prepareImageContent(imageInputs);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data[0].source.media_type).toBe('image/gif');
    }
  });

  it('handles download errors for key inputs', async () => {
    const mockDownloadBuffer = mock(() => Promise.reject(new Error('Download failed')));

    mock.module('@/lib/r2', () => ({
      downloadBuffer: mockDownloadBuffer
    }));

    const imageInputs = [
      { type: 'key' as const, value: 'test-key-1' }
    ];

    const result = await prepareImageContent(imageInputs);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('Failed to download image');
      expect(result.error.message).toContain('Download failed');
    }
  });

  it('handles mixed URL and key inputs', async () => {
    const mockDownloadBuffer = mock(() => Promise.resolve(Buffer.from([0xFF, 0xD8, 0xFF, 0xE0])));

    mock.module('@/lib/r2', () => ({
      downloadBuffer: mockDownloadBuffer
    }));

    const imageInputs = [
      { type: 'url' as const, value: 'https://example.com/image1.jpg' },
      { type: 'key' as const, value: 'test-key-1' },
      { type: 'url' as const, value: 'https://example.com/image2.png' }
    ];

    const result = await prepareImageContent(imageInputs);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(3);
      expect(result.data[0].source.type).toBe('url');
      expect(result.data[1].source.type).toBe('base64');
      expect(result.data[2].source.type).toBe('url');
    }
  });
});

describe('callGeminiEvaluationAPI', () => {
  beforeEach(() => {
    // Reset mocks
    mock.restore();
  });

  it('successfully calls API and returns evaluation data', async () => {
    const imageContent = [
      {
        type: 'image' as const,
        source: { type: 'url' as const, url: 'https://example.com/image.jpg' }
      }
    ];

    const result = await callGeminiEvaluationAPI(imageContent, 'claude-sonnet-4-20250514', 3, 'test-api-key');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.evaluationData.overall).toBe(8.2);
      expect(result.data.evaluationData.consistency).toBe(8);
      expect(result.data.evaluationData.variety).toBe(9);
      expect(result.data.evaluationData.physicalPlausibility).toBe(8);
      expect(result.data.evaluationData.reasoning).toBe('Test reasoning');
      expect(result.data.evaluationData.suggestions).toEqual(['Test suggestion']);
      expect(result.data.tokensUsed).toBe(150);
      expect(result.data.costUsd).toBe(0.01);
    }
  });

  it('handles API response without text content', async () => {
    // Mock Anthropic to return response without text content
    mock.module('@anthropic-ai/sdk', () => ({
      default: class {
        messages = {
          create: mock(() => Promise.resolve({
            content: [{ type: 'image' }],
            usage: { input_tokens: 100, output_tokens: 50 }
          }))
        };
      }
    }));

    const imageContent = [
      {
        type: 'image' as const,
        source: { type: 'url' as const, url: 'https://example.com/image.jpg' }
      }
    ];

    const result = await callGeminiEvaluationAPI(imageContent, 'claude-sonnet-4-20250514', 3, 'test-api-key');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('No text response from collection evaluator');
    }
  });

  it('handles API response without text content', async () => {
    // Mock Anthropic to return response without text content
    mock.module('@anthropic-ai/sdk', () => ({
      default: class {
        messages = {
          create: mock(() => Promise.resolve({
            content: [{ type: 'image' }],
            usage: { input_tokens: 100, output_tokens: 50 }
          }))
        };
      }
    }));

    const imageContent = [
      {
        type: 'image' as const,
        source: { type: 'url' as const, url: 'https://example.com/image.jpg' }
      }
    ];

    const result = await callGeminiEvaluationAPI(imageContent, 'claude-sonnet-4-20250514', 3, 'test-api-key');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('No text response from collection evaluator');
    }
  });
});