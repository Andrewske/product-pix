// Environment variables are set globally in bun-test-setup.ts

// Mock Anthropic client before importing the module
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

  if (content.includes('refund')) {
    return Promise.resolve({
      content: [{
        type: 'text',
        text: JSON.stringify({
          category: 'billing',
          sentiment: 'negative',
          confidence: 0.8,
        }),
      }],
    });
  }

  if (content.includes('feature')) {
    return Promise.resolve({
      content: [{
        type: 'text',
        text: JSON.stringify({
          category: 'feature_request',
          sentiment: 'neutral',
          confidence: 0.7,
        }),
      }],
    });
  }

  if (content.includes('slow')) {
    return Promise.resolve({
      content: [{
        type: 'text',
        text: JSON.stringify({
          category: 'complaint',
          sentiment: 'negative',
          confidence: 0.75,
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
        confidence: 0.6,
      }),
    }],
  });
});

mock.module('@anthropic-ai/sdk', () => ({
  Anthropic: class {
    constructor(options: any = {}) {
      // Allow browser usage in tests
      if (!options.dangerouslyAllowBrowser) {
        options.dangerouslyAllowBrowser = true;
      }
    }
    messages = {
      create: mockCreate,
    };
  },
}));

import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { analyzeSentiment } from '../sentiment-analysis';

// Mock logger
const mockLogger = {
  error: mock(() => {}),
};

mock.module('@/lib/logging', () => ({
  logger: mockLogger,
}));

describe('analyzeSentiment', () => {
  beforeEach(() => {
    mockCreate.mockClear();
    mockLogger.error.mockClear();
  });

  it('classifies bug reports correctly', async () => {
    const result = await analyzeSentiment('I found a bug in the image generation');

    expect(result).not.toBeNull();
    expect(result?.category).toBe('bug_report');
    expect(result?.sentiment).toBe('negative');
    expect(result?.confidence).toBe(0.9);
  });

  it('classifies praise correctly', async () => {
    const result = await analyzeSentiment('I love this product!');

    expect(result).not.toBeNull();
    expect(result?.category).toBe('praise');
    expect(result?.sentiment).toBe('positive');
    expect(result?.confidence).toBe(0.85);
  });

  it('classifies billing issues correctly', async () => {
    const result = await analyzeSentiment('I need a refund for my purchase');

    expect(result).not.toBeNull();
    expect(result?.category).toBe('billing');
    expect(result?.sentiment).toBe('negative');
    expect(result?.confidence).toBe(0.8);
  });

  it('classifies feature requests correctly', async () => {
    const result = await analyzeSentiment('Can you add a feature to upload multiple images?');

    expect(result).not.toBeNull();
    expect(result?.category).toBe('feature_request');
    expect(result?.sentiment).toBe('neutral');
    expect(result?.confidence).toBe(0.7);
  });

  it('classifies complaints correctly', async () => {
    const result = await analyzeSentiment('The app is too slow and frustrating');

    expect(result).not.toBeNull();
    expect(result?.category).toBe('complaint');
    expect(result?.sentiment).toBe('negative');
    expect(result?.confidence).toBe(0.75);
  });

  it('handles neutral messages', async () => {
    const result = await analyzeSentiment('How does this work?');

    expect(result).not.toBeNull();
    expect(result?.category).toBe('other');
    expect(result?.sentiment).toBe('neutral');
    expect(result?.confidence).toBe(0.6);
  });

  it('handles API errors gracefully', async () => {
    mockCreate.mockImplementationOnce(() => {
      throw new Error('API error');
    });

    const result = await analyzeSentiment('Test message');
    expect(result).toBeNull();

    expect(mockLogger.error).toHaveBeenCalledWith('Error analyzing sentiment', {
      error: 'API error',
    });
  });

  it('validates confidence range', async () => {
    mockCreate.mockImplementationOnce(() => Promise.resolve({
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
    expect(result?.confidence).toBe(1); // Clamped to max

    mockCreate.mockImplementationOnce(() => Promise.resolve({
      content: [{
        type: 'text',
        text: JSON.stringify({
          category: 'other',
          sentiment: 'neutral',
          confidence: -0.5, // Invalid - should be clamped
        }),
      }],
    }));

    const result2 = await analyzeSentiment('Test');
    expect(result2?.confidence).toBe(0); // Clamped to min
  });

  it('returns null on invalid JSON', async () => {
    mockCreate.mockImplementationOnce(() => Promise.resolve({
      content: [{
        type: 'text',
        text: 'Not valid JSON at all',
      }],
    }));

    const result = await analyzeSentiment('Test');
    expect(result).toBeNull();

    expect(mockLogger.error).toHaveBeenCalledWith('Failed to extract JSON from sentiment analysis', {
      text: 'Not valid JSON at all',
    });
  });

  it('returns null on malformed JSON', async () => {
    mockCreate.mockImplementationOnce(() => Promise.resolve({
      content: [{
        type: 'text',
        text: '{ invalid json }',
      }],
    }));

    const result = await analyzeSentiment('Test');
    expect(result).toBeNull();
  });

  it('validates category values', async () => {
    mockCreate.mockImplementationOnce(() => Promise.resolve({
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

    expect(mockLogger.error).toHaveBeenCalledWith('Invalid sentiment analysis result', {
      result: {
        category: 'invalid_category',
        sentiment: 'positive',
        confidence: 0.8,
      },
    });
  });

  it('validates sentiment values', async () => {
    mockCreate.mockImplementationOnce(() => Promise.resolve({
      content: [{
        type: 'text',
        text: JSON.stringify({
          category: 'other',
          sentiment: 'invalid_sentiment',
          confidence: 0.8,
        }),
      }],
    }));

    const result = await analyzeSentiment('Test');
    expect(result).toBeNull();
  });

  it('validates confidence type', async () => {
    mockCreate.mockImplementationOnce(() => Promise.resolve({
      content: [{
        type: 'text',
        text: JSON.stringify({
          category: 'other',
          sentiment: 'neutral',
          confidence: 'not_a_number',
        }),
      }],
    }));

    const result = await analyzeSentiment('Test');
    expect(result).toBeNull();
  });

  it('handles non-text content types', async () => {
    mockCreate.mockImplementationOnce(() => Promise.resolve({
      content: [{
        type: 'image', // Not text
        text: 'should not be used',
      }],
    }));

    const result = await analyzeSentiment('Test');
    expect(result).toBeNull();
  });
});