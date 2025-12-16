import { describe, it, expect, mock } from 'bun:test';
import { coordinateCollectionGeneration } from '../core/orchestrator';
import type { CollectionTemplate, BatchFile } from '../core/types';

// Mock dependencies
const createMockDependencies = () => ({
  supabase: {
    from: mock(() => ({
      insert: mock(() => ({
        select: mock(() => ({
          single: mock(() => Promise.resolve({ data: { id: 'test-id' }, error: null }))
        }))
      })),
      update: mock(() => ({
        eq: mock(() => Promise.resolve({ error: null }))
      })),
      select: mock(() => ({
        eq: mock(() => ({
          single: mock(() => Promise.resolve({ data: null, error: null }))
        }))
      }))
    }))
  },
  gemini: {
    generateFromImage: mock(() => Promise.resolve({
      success: true,
      imageData: 'base64data',
      usage: { promptTokens: 100, completionTokens: 50 }
    })),
    generateFromText: mock(() => Promise.resolve({
      success: true,
      imageData: 'base64data',
      usage: { promptTokens: 100, completionTokens: 50 }
    }))
  }
});

// Mock other dependencies
mock.module('@bench/core/compiler', () => ({
  compileTemplate: mock(() => ({ ok: true, data: { prompt: 'compiled prompt' } })),
  generateIdempotencyKey: mock(() => 'test-key')
}));

mock.module('@bench/core/source-image', () => ({
  resolveSourceImage: mock(() => Promise.resolve({ ok: true, data: { r2Url: 'test-url', r2Key: 'test-key', hash: 'test-hash', buffer: Buffer.from('test'), mimeType: 'image/png' } }))
}));

mock.module('@bench/core/category-classifier', () => ({
  classifyProduct: mock(() => Promise.resolve({ ok: true, data: 'generic' }))
}));

mock.module('@bench/core/category-angles', () => ({
  getAnglesForCategory: mock(() => ['front', 'side', 'back'])
}));

mock.module('@/lib/r2', () => ({
  uploadBuffer: mock(() => Promise.resolve()),
  getPublicUrl: mock(() => 'https://test.com/image.png')
}));

mock.module('@bench/core/cost', () => ({
  calculateCost: mock(() => ({ ok: true, data: { total: 0.01 } }))
}));

describe('coordinateCollectionGeneration', () => {
  it('successfully generates a collection with source images', async () => {
    const template: CollectionTemplate & { id: string } = {
      slug: 'test-template',
      version: 1,
      status: 'active',
      type: 'collection',
      templateData: { subject: 'Test subject' },
      variablesSchema: {},
      outputCount: 2,
      varietyStrategy: 'category-based',
      id: 'template-id'
    };

    const batch: BatchFile = {
      tests: [
        {
          variables: { product: 'test product' },
          sourceImages: ['image1.jpg']
        }
      ]
    };

    const dependencies = createMockDependencies();

    const result = await coordinateCollectionGeneration(
      template,
      batch,
      'test-batch',
      false,
      '/path/to/batch',
      dependencies as any
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.completed).toBe(2); // 2 images generated
      expect(result.data.failed).toBe(0);
      expect(result.data.skipped).toBe(0);
      expect(result.data.tests).toHaveLength(2);
    }
  });



  it('skips existing tests in non-dry-run mode', async () => {
    const mockSupabase = {
      from: mock(() => ({
        insert: mock(() => ({
          select: mock(() => ({
            single: mock(() => Promise.resolve({ data: { id: 'test-id' }, error: null }))
          }))
        })),
        update: mock(() => ({
          eq: mock(() => Promise.resolve({ error: null }))
        })),
        select: mock(() => ({
          eq: mock(() => ({
            single: mock(() => Promise.resolve({ data: { id: 'existing-id', status: 'completed' }, error: null }))
          }))
        }))
      }))
    };

    const template: CollectionTemplate & { id: string } = {
      slug: 'test-template',
      version: 1,
      status: 'active',
      type: 'collection',
      templateData: { subject: 'Test subject' },
      variablesSchema: {},
      outputCount: 1,
      varietyStrategy: 'ai-decided',
      id: 'template-id'
    };

    const batch: BatchFile = {
      tests: [
        {
          variables: { product: 'test product' }
        }
      ]
    };

    const dependencies = {
      supabase: mockSupabase,
      gemini: createMockDependencies().gemini
    };

    const result = await coordinateCollectionGeneration(
      template,
      batch,
      'test-batch',
      false,
      '/path/to/batch',
      dependencies as any
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.completed).toBe(0);
      expect(result.data.skipped).toBe(1);
      expect(result.data.tests).toHaveLength(1);
    }
  });

  it('handles dry-run mode', async () => {
    const template: CollectionTemplate & { id: string } = {
      slug: 'test-template',
      version: 1,
      status: 'active',
      type: 'collection',
      templateData: { subject: 'Test subject' },
      variablesSchema: {},
      outputCount: 2,
      varietyStrategy: 'ai-decided',
      id: 'template-id'
    };

    const batch: BatchFile = {
      tests: [
        {
          variables: { product: 'test product' }
        }
      ]
    };

    const dependencies = createMockDependencies();

    const result = await coordinateCollectionGeneration(
      template,
      batch,
      'test-batch',
      true, // dryRun
      '/path/to/batch',
      dependencies as any
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.completed).toBe(2);
      expect(result.data.failed).toBe(0);
      expect(result.data.skipped).toBe(0);
      expect(result.data.tests).toHaveLength(0); // No actual tests created in dry run
    }
  });

  it('handles generation failures', async () => {
    const mockGemini = {
      generateFromText: mock(() => Promise.resolve({
        success: false,
        error: 'Generation failed'
      }))
    };

    const template: CollectionTemplate & { id: string } = {
      slug: 'test-template',
      version: 1,
      status: 'active',
      type: 'collection',
      templateData: { subject: 'Test subject' },
      variablesSchema: {},
      outputCount: 1,
      varietyStrategy: 'ai-decided',
      id: 'template-id'
    };

    const batch: BatchFile = {
      tests: [
        {
          variables: { product: 'test product' }
        }
      ]
    };

    const dependencies = {
      supabase: createMockDependencies().supabase,
      gemini: mockGemini
    };

    const result = await coordinateCollectionGeneration(
      template,
      batch,
      'test-batch',
      false,
      '/path/to/batch',
      dependencies as any
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('Generation failed');
    }
  });
});