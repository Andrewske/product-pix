import { getCreditsForResolution, calculateBatchCredits, type Resolution } from '../credits';

describe('getCreditsForResolution', () => {
  it('returns 1 for 1k resolution', () => {
    expect(getCreditsForResolution('1k')).toBe(1);
  });

  it('returns 2 for 2k resolution', () => {
    expect(getCreditsForResolution('2k')).toBe(2);
  });

  it('returns 3 for 4k resolution', () => {
    expect(getCreditsForResolution('4k')).toBe(3);
  });

  it('is type-safe for valid resolutions', () => {
    const resolutions: Resolution[] = ['1k', '2k', '4k'];
    resolutions.forEach(resolution => {
      expect(typeof getCreditsForResolution(resolution)).toBe('number');
    });
  });
});

describe('calculateBatchCredits', () => {
  it('returns 5 for batch with 2k and 4k items', () => {
    const items = [
      { resolution: '2k' as const },
      { resolution: '4k' as const },
    ];
    expect(calculateBatchCredits(items)).toBe(5);
  });

  it('returns 0 for empty batch', () => {
    expect(calculateBatchCredits([])).toBe(0);
  });

  it('returns 1 for single 1k item', () => {
    const items = [{ resolution: '1k' as const }];
    expect(calculateBatchCredits(items)).toBe(1);
  });

  it('returns 6 for three 2k items', () => {
    const items = [
      { resolution: '2k' as const },
      { resolution: '2k' as const },
      { resolution: '2k' as const },
    ];
    expect(calculateBatchCredits(items)).toBe(6);
  });

  it('returns 9 for mixed resolutions', () => {
    const items = [
      { resolution: '1k' as const },
      { resolution: '2k' as const },
      { resolution: '4k' as const },
    ];
    expect(calculateBatchCredits(items)).toBe(6);
  });

  it('handles readonly arrays', () => {
    const items: ReadonlyArray<{ readonly resolution: Resolution }> = [
      { resolution: '1k' },
      { resolution: '2k' },
    ];
    expect(calculateBatchCredits(items)).toBe(3);
  });
});