import { describe, it, expect } from 'bun:test';
import { getCreditsForGeneration, calculateGenerationCost, type Resolution } from '../credits';

describe('getCreditsForGeneration', () => {
  it('returns 30 for 1k lightning mode', () => {
    expect(getCreditsForGeneration('1k', 'lightning')).toBe(30);
  });

  it('returns 15 for 1k snail mode', () => {
    expect(getCreditsForGeneration('1k', 'snail')).toBe(15);
  });

  it('returns 60 for 2k lightning mode', () => {
    expect(getCreditsForGeneration('2k', 'lightning')).toBe(60);
  });

  it('returns 30 for 2k snail mode', () => {
    expect(getCreditsForGeneration('2k', 'snail')).toBe(30);
  });

  it('returns 120 for 4k lightning mode', () => {
    expect(getCreditsForGeneration('4k', 'lightning')).toBe(120);
  });

  it('returns 60 for 4k snail mode', () => {
    expect(getCreditsForGeneration('4k', 'snail')).toBe(60);
  });

  it('is type-safe for valid resolutions and modes', () => {
    const resolutions: Resolution[] = ['1k', '2k', '4k'];
    const modes = ['lightning', 'snail'] as const;
    resolutions.forEach(resolution => {
      modes.forEach(mode => {
        expect(typeof getCreditsForGeneration(resolution, mode)).toBe('number');
      });
    });
  });
});

describe('calculateGenerationCost', () => {
  it('returns correct breakdown for lightning 1k with no addons', () => {
    const result = calculateGenerationCost({
      resolution: '1k',
      mode: 'lightning'
    });
    expect(result).toEqual({
      baseGeneration: 30,
      addons: [],
      total: 30
    });
  });

  it('returns correct breakdown for snail 2k with no addons', () => {
    const result = calculateGenerationCost({
      resolution: '2k',
      mode: 'snail'
    });
    expect(result).toEqual({
      baseGeneration: 30,
      addons: [],
      total: 30
    });
  });

  it('returns correct breakdown with addons', () => {
    const result = calculateGenerationCost({
      resolution: '1k',
      mode: 'lightning',
      addons: ['titleGeneration', 'fancyBackground']
    });
    expect(result).toEqual({
      baseGeneration: 30,
      addons: [
        { name: 'titleGeneration', credits: 50 },
        { name: 'fancyBackground', credits: 10 }
      ],
      total: 90
    });
  });

  it('handles empty addons array', () => {
    const result = calculateGenerationCost({
      resolution: '4k',
      mode: 'snail',
      addons: []
    });
    expect(result).toEqual({
      baseGeneration: 60,
      addons: [],
      total: 60
    });
  });

  it('handles undefined addons', () => {
    const result = calculateGenerationCost({
      resolution: '2k',
      mode: 'lightning'
    });
    expect(result).toEqual({
      baseGeneration: 60,
      addons: [],
      total: 60
    });
  });
});