import { describe, it, expect } from 'bun:test';
import { mergeAnalysisResults, hashImageBatch } from '@bench/core/consensus';

describe('mergeAnalysisResults', () => {
  it('uses majority vote for single-value fields', () => {
    const results = [
      { product: 'bag', color: 'brown', material: 'leather', shape: 'rect', features: [] },
      { product: 'bag', color: 'brown', material: 'leather', shape: 'rect', features: [] },
      { product: 'bag', color: 'black', material: 'leather', shape: 'rect', features: [] },
    ];

    const merged = mergeAnalysisResults(results);

    expect(merged.product).toBe('bag');
    expect(merged.color).toBe('brown');  // 2 votes vs 1
    expect(merged.material).toBe('leather');
  });

  it('handles tie-breaking by first occurrence', () => {
    const results = [
      { product: 'bag', color: 'brown', material: 'leather', shape: 'rect', features: [] },
      { product: 'bag', color: 'black', material: 'leather', shape: 'rect', features: [] },
    ];

    const merged = mergeAnalysisResults(results);

    expect(merged.color).toBe('brown');  // Tie, first wins
  });

  it('creates union of features arrays', () => {
    const results = [
      { product: 'bag', color: 'brown', material: 'leather', shape: 'rect', features: ['zipper', 'strap'] },
      { product: 'bag', color: 'brown', material: 'leather', shape: 'rect', features: ['strap', 'pocket'] },
    ];

    const merged = mergeAnalysisResults(results);

    expect(merged.features).toEqual(['zipper', 'strap', 'pocket']);
  });

  it('throws on empty results', () => {
    expect(() => mergeAnalysisResults([])).toThrow('Cannot merge empty analysis results');
  });

  it('returns single result unchanged', () => {
    const single = { product: 'bag', color: 'brown', material: 'leather', shape: 'rect', features: ['zipper'] };
    const merged = mergeAnalysisResults([single]);

    expect(merged).toEqual(single);
  });
});

describe('hashImageBatch', () => {
  it('produces consistent hash for same inputs', () => {
    const hashes1 = ['hash1', 'hash2', 'hash3'];
    const hashes2 = ['hash1', 'hash2', 'hash3'];

    const result1 = hashImageBatch(hashes1);
    const result2 = hashImageBatch(hashes2);

    expect(result1).toBe(result2);
  });

  it('produces different hash when inputs change', () => {
    const hashes1 = ['hash1', 'hash2', 'hash3'];
    const hashes2 = ['hash1', 'hash2', 'hash4'];

    const result1 = hashImageBatch(hashes1);
    const result2 = hashImageBatch(hashes2);

    expect(result1).not.toBe(result2);
  });

  it('produces different hash when order changes', () => {
    const hashes1 = ['hash1', 'hash2', 'hash3'];
    const hashes2 = ['hash3', 'hash2', 'hash1'];

    const result1 = hashImageBatch(hashes1);
    const result2 = hashImageBatch(hashes2);

    expect(result1).not.toBe(result2);
  });
});
