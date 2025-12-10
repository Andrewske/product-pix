// src/lib/ai/__tests__/prompt-builder.test.ts
import { describe, it, expect, beforeEach, mock } from 'bun:test';
import type { ProductAnalysis } from '../types';

// Mock the database functions
mock.module('@/lib/db/templates', () => ({
  getTemplateById: mock(),
  getTemplateBySlug: mock(),
}));

// Mock the compiler
mock.module('@bench/core/compiler', () => ({
  compileTemplate: mock(),
}));

// Import the mocked functions after mocking
const { getTemplateById, getTemplateBySlug } = await import('@/lib/db/templates');
const { compileTemplate } = await import('@bench/core/compiler');
const { buildPromptFromTemplate, buildPromptFromTemplateSlug } = await import('../prompt-builder');

const mockGetTemplateById = getTemplateById as ReturnType<typeof mock>;
const mockGetTemplateBySlug = getTemplateBySlug as ReturnType<typeof mock>;
const mockCompileTemplate = compileTemplate as ReturnType<typeof mock>;

const mockTemplate = {
  id: 'template-123',
  slug: 'ecommerce-base',
  version: 1,
  status: 'active',
  templateData: {
    subject: 'Professional e-commerce photo of {product}',
    background: 'on pure white seamless background',
    lighting: 'soft diffused studio lighting',
  },
  variablesSchema: {
    product: { type: 'string', required: true },
    color: { type: 'string', required: false },
    material: { type: 'string', required: false },
    shape: { type: 'string', required: false },
    features: { type: 'string', required: false },
  },
  createdAt: '2024-01-01T00:00:00Z',
};

const mockAnalysis: ProductAnalysis = {
  product: 'ceramic coffee mug',
  color: 'matte black',
  material: 'ceramic',
  shape: 'cylindrical with handle',
  features: ['textured surface', 'wide rim'],
};

describe('buildPromptFromTemplate', () => {
  beforeEach(() => {
    mockGetTemplateById.mockReset();
    mockGetTemplateBySlug.mockReset();
    mockCompileTemplate.mockReset();
  });

  it('should successfully build prompt with analysis data', async () => {
    mockGetTemplateById.mockResolvedValue(mockTemplate);
    mockCompileTemplate.mockReturnValue({
      ok: true,
      data: {
        prompt: 'Professional e-commerce photo of ceramic coffee mug on pure white seamless background, soft diffused studio lighting',
        usedVariables: {
          product: 'ceramic coffee mug',
          color: 'matte black',
          material: 'ceramic',
          shape: 'cylindrical with handle',
          features: 'textured surface, wide rim',
        },
        defaultsApplied: [],
      },
    });

    const result = await buildPromptFromTemplate('template-123', mockAnalysis);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toBe('Professional e-commerce photo of ceramic coffee mug on pure white seamless background, soft diffused studio lighting');
    }
    expect(mockGetTemplateById).toHaveBeenCalledWith('template-123');
    expect(mockCompileTemplate).toHaveBeenCalledWith(
      mockTemplate.templateData,
      mockTemplate.variablesSchema,
      {
        product: 'ceramic coffee mug',
        color: 'matte black',
        material: 'ceramic',
        shape: 'cylindrical with handle',
        features: 'textured surface, wide rim',
      },
      { skipValidation: false }
    );
  });

  it('should build prompt with empty strings when analysis is undefined', async () => {
    mockGetTemplateById.mockResolvedValue(mockTemplate);
    mockCompileTemplate.mockReturnValue({
      ok: true,
      data: {
        prompt: 'Professional e-commerce photo of  on pure white seamless background, soft diffused studio lighting',
        usedVariables: {
          product: '',
          color: '',
          material: '',
          shape: '',
          features: '',
        },
        defaultsApplied: [],
      },
    });

    const result = await buildPromptFromTemplate('template-123', undefined);

    expect(result.ok).toBe(true);
    expect(mockCompileTemplate).toHaveBeenCalledWith(
      mockTemplate.templateData,
      mockTemplate.variablesSchema,
      {
        product: '',
        color: '',
        material: '',
        shape: '',
        features: '',
      },
      { skipValidation: false }
    );
  });

  it('should return error when template is not found', async () => {
    mockGetTemplateById.mockResolvedValue(null);

    const result = await buildPromptFromTemplate('nonexistent-template', mockAnalysis);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('TEMPLATE_NOT_FOUND');
      expect(result.error.message).toContain('nonexistent-template');
    }
    expect(mockCompileTemplate).not.toHaveBeenCalled();
  });

  it('should return error when compilation fails', async () => {
    mockGetTemplateById.mockResolvedValue(mockTemplate);
    mockCompileTemplate.mockReturnValue({
      ok: false,
      error: {
        code: 'COMPILATION_ERROR',
        message: 'Unresolved variables in prompt: {invalid_var}',
        retryable: false,
      },
    });

    const result = await buildPromptFromTemplate('template-123', mockAnalysis);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('COMPILATION_ERROR');
      expect(result.error.message).toContain('Failed to compile template');
    }
  });
});

describe('buildPromptFromTemplateSlug', () => {
  const mockTemplateSlug = {
    id: 'template-456',
    slug: 'ecommerce-base',
    version: 2,
    status: 'active',
    templateData: {
      subject: 'Professional photo of {product}',
    },
    variablesSchema: {
      product: { type: 'string', required: true },
    },
    createdAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    mockGetTemplateById.mockReset();
    mockGetTemplateBySlug.mockReset();
    mockCompileTemplate.mockReset();
  });

  it('should successfully build prompt using slug', async () => {
    mockGetTemplateBySlug.mockResolvedValue(mockTemplateSlug);
    mockCompileTemplate.mockReturnValue({
      ok: true,
      data: {
        prompt: 'Professional photo of test product',
        usedVariables: { product: 'test product' },
        defaultsApplied: [],
      },
    });

    const result = await buildPromptFromTemplateSlug('ecommerce-base', mockAnalysis);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toBe('Professional photo of test product');
    }
    expect(mockGetTemplateBySlug).toHaveBeenCalledWith('ecommerce-base');
  });

  it('should return error when template slug is not found', async () => {
    mockGetTemplateBySlug.mockResolvedValue(null);

    const result = await buildPromptFromTemplateSlug('nonexistent-slug', mockAnalysis);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('TEMPLATE_NOT_FOUND');
      expect(result.error.message).toContain('nonexistent-slug');
    }
  });
});
