// prompt-bench/__tests__/compiler-minimal-variables.test.ts
import { compileTemplate } from '@bench/core/compiler';
import type { TemplateData, VariablesSchema } from '@bench/core/types';

describe('Minimal Variable Templates', () => {
  const variablesSchema: VariablesSchema = {
    product: { type: 'string', required: true },
    style: { type: 'string', required: true },
    lighting_style: { type: 'string', required: true },
    background_type: { type: 'string', required: true },
  };

  it('should compile v4 template with only product variable', () => {
    const templateData: TemplateData = {
      subject: 'A photo of {product}',
      background: 'clean white background',
      lighting: 'bright studio lighting',
      camera: 'professional DSLR camera',
      style: 'commercial product photography',
      quality: 'high resolution, sharp focus',
      negative: 'blurry, low quality, distorted',
    };

    const providedVariables = { product: 'red coffee mug' };

    const result = compileTemplate(templateData, variablesSchema, providedVariables);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.prompt).toContain('A photo of red coffee mug');
      expect(result.data.prompt).toContain('clean white background');
    }
  });

  it('should ignore schema variables not used in template', () => {
    const templateData: TemplateData = {
      subject: 'A photo of {product}',
      background: 'clean white background',
      lighting: 'bright studio lighting',
      camera: 'professional DSLR camera',
      style: 'commercial product photography',
      quality: 'high resolution, sharp focus',
      negative: 'blurry, low quality, distorted',
    };

    // Schema has style, lighting_style, background_type as required, but template doesn't use them
    const providedVariables = { product: 'red coffee mug' };

    const result = compileTemplate(templateData, variablesSchema, providedVariables);

    expect(result.ok).toBe(true);
  });

  it('should fail if truly required variable is missing', () => {
    const templateData: TemplateData = {
      subject: 'A photo of {product}',
      background: 'clean white background',
    };

    const providedVariables = {}; // Missing product

    const result = compileTemplate(templateData, variablesSchema, providedVariables);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('Missing required variables: product');
    }
  });

  it('should compile template with all hardcoded values', () => {
    const templateData: TemplateData = {
      subject: 'A photo of a coffee mug',
      background: 'clean white background',
      lighting: 'bright studio lighting',
      camera: 'professional DSLR camera',
      style: 'commercial product photography',
      quality: 'high resolution, sharp focus',
      negative: 'blurry, low quality, distorted',
    };

    const providedVariables = {}; // No variables needed

    const result = compileTemplate(templateData, variablesSchema, providedVariables);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.prompt).toContain('A photo of a coffee mug');
    }
  });
});