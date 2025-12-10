// src/lib/ai/__tests__/title-generator.test.ts
import { generateImageTitle, getTitleFromFilename } from '../title-generator';
import type { ProductAnalysis } from '../types';

describe('generateImageTitle', () => {
  it('should generate title from complete analysis', () => {
    const analysis: ProductAnalysis = {
      product: 'ceramic coffee mug',
      color: 'matte black',
      material: 'ceramic',
      shape: 'cylindrical with handle',
      features: ['textured surface', 'wide rim'],
    };

    const result = generateImageTitle(analysis);
    expect(result).toBe('ceramic-coffee-mug-matte-black-ceramic');
  });

  it('should handle missing color', () => {
    const analysis: ProductAnalysis = {
      product: 'ceramic coffee mug',
      color: '',
      material: 'ceramic',
      shape: 'cylindrical with handle',
      features: ['textured surface', 'wide rim'],
    };

    const result = generateImageTitle(analysis);
    expect(result).toBe('ceramic-coffee-mug-ceramic');
  });

  it('should handle missing material', () => {
    const analysis: ProductAnalysis = {
      product: 'ceramic coffee mug',
      color: 'matte black',
      material: '',
      shape: 'cylindrical with handle',
      features: ['textured surface', 'wide rim'],
    };

    const result = generateImageTitle(analysis);
    expect(result).toBe('ceramic-coffee-mug-matte-black');
  });

  it('should include material even if duplicate', () => {
    const analysis: ProductAnalysis = {
      product: 'ceramic mug',
      color: 'white',
      material: 'ceramic',
      shape: 'cylindrical',
      features: [],
    };

    const result = generateImageTitle(analysis);
    expect(result).toBe('ceramic-mug-white-ceramic');
  });

  it('should include color even if duplicate', () => {
    const analysis: ProductAnalysis = {
      product: 'black ceramic mug',
      color: 'black',
      material: 'ceramic',
      shape: 'cylindrical',
      features: [],
    };

    const result = generateImageTitle(analysis);
    expect(result).toBe('black-ceramic-mug-black-ceramic');
  });

  it('should handle empty product', () => {
    const analysis: ProductAnalysis = {
      product: '',
      color: 'matte black',
      material: 'ceramic',
      shape: 'cylindrical with handle',
      features: ['textured surface', 'wide rim'],
    };

    const result = generateImageTitle(analysis);
    expect(result).toBe('untitled-product');
  });

  it('should handle all empty fields', () => {
    const analysis: ProductAnalysis = {
      product: '',
      color: '',
      material: '',
      shape: '',
      features: [],
    };

    const result = generateImageTitle(analysis);
    expect(result).toBe('untitled-product');
  });

  it('should handle special characters and spaces', () => {
    const analysis: ProductAnalysis = {
      product: 'T-shirt & Hoodie Set',
      color: 'Navy Blue',
      material: 'Cotton Blend',
      shape: 'rectangular',
      features: [],
    };

    const result = generateImageTitle(analysis);
    expect(result).toBe('t-shirt-hoodie-set-navy-blue-cotton-blend');
  });

  it('should handle multiple spaces and normalize', () => {
    const analysis: ProductAnalysis = {
      product: '  coffee   mug  ',
      color: '  matte    black  ',
      material: 'ceramic',
      shape: 'cylindrical',
      features: [],
    };

    const result = generateImageTitle(analysis);
    expect(result).toBe('coffee-mug-matte-black-ceramic');
  });
});

describe('getTitleFromFilename', () => {
  it('should extract title from filename with extension', () => {
    expect(getTitleFromFilename('product-shot-v2.jpg')).toBe('product-shot-v2');
    expect(getTitleFromFilename('image.png')).toBe('image');
    expect(getTitleFromFilename('photo-with-dash.jpeg')).toBe('photo-with-dash');
  });

  it('should handle filenames without extension', () => {
    expect(getTitleFromFilename('product-shot-v2')).toBe('product-shot-v2');
    expect(getTitleFromFilename('image')).toBe('image');
  });

  it('should handle multiple dots in filename', () => {
    expect(getTitleFromFilename('my.image.v2.jpg')).toBe('my.image.v2');
    expect(getTitleFromFilename('file.name.with.dots.png')).toBe('file.name.with.dots');
  });

  it('should handle empty filename after extension removal', () => {
    expect(getTitleFromFilename('.jpg')).toBe('untitled');
    expect(getTitleFromFilename('.png')).toBe('untitled');
  });

  it('should handle whitespace around filename', () => {
    expect(getTitleFromFilename('  product-shot-v2.jpg  ')).toBe('product-shot-v2');
    expect(getTitleFromFilename('  .jpg  ')).toBe('untitled');
  });

  it('should handle empty string', () => {
    expect(getTitleFromFilename('')).toBe('untitled');
  });
});