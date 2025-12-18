# Update Tests

## Files to Modify
- `src/lib/pricing/__tests__/credits.test.ts` (modify)
- `src/lib/pricing/__tests__/pricing.config.test.ts` (modify)
- `src/app/api/generate/__tests__/route.test.ts` (modify - if exists)

## Implementation Details

### 1. Update `credits.test.ts`

**Add tests for new functions:**

```typescript
describe('getCreditsForGeneration', () => {
  it('returns correct credits for lightning mode 1k', () => {
    expect(getCreditsForGeneration('1k', 'lightning')).toBe(30);
  });

  it('returns correct credits for lightning mode 2k', () => {
    expect(getCreditsForGeneration('2k', 'lightning')).toBe(60);
  });

  it('returns correct credits for lightning mode 4k', () => {
    expect(getCreditsForGeneration('4k', 'lightning')).toBe(120);
  });

  it('returns correct credits for snail mode 1k', () => {
    expect(getCreditsForGeneration('1k', 'snail')).toBe(15);
  });

  it('returns correct credits for snail mode 2k', () => {
    expect(getCreditsForGeneration('2k', 'snail')).toBe(30);
  });

  it('returns correct credits for snail mode 4k', () => {
    expect(getCreditsForGeneration('4k', 'snail')).toBe(60);
  });
});

describe('calculateGenerationCost', () => {
  it('calculates cost for lightning 1k with no addons', () => {
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

  it('calculates cost for snail 2k with no addons', () => {
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

  it('calculates cost with addons', () => {
    const result = calculateGenerationCost({
      resolution: '1k',
      mode: 'lightning',
      addons: ['titleGeneration', 'fancyBackground']
    });

    expect(result.baseGeneration).toBe(30);
    expect(result.addons).toHaveLength(2);
    expect(result.addons[0]).toEqual({ name: 'titleGeneration', credits: 50 });
    expect(result.addons[1]).toEqual({ name: 'fancyBackground', credits: 10 });
    expect(result.total).toBe(90); // 30 + 50 + 10
  });

  it('handles empty addons array', () => {
    const result = calculateGenerationCost({
      resolution: '1k',
      mode: 'lightning',
      addons: []
    });

    expect(result.total).toBe(30);
    expect(result.addons).toEqual([]);
  });
});
```

**Update existing tests:**
- Update any tests that reference old credit amounts (1, 2, 3)
- Update tests to use new credit values (30, 60, 120 for standard)

### 2. Update `pricing.config.test.ts`

**Add tests for new config structure:**

```typescript
describe('creditEconomy config', () => {
  it('has valid generationCosts structure', () => {
    expect(creditEconomy.generationCosts).toBeDefined();
    expect(creditEconomy.generationCosts.standard).toBeDefined();
    expect(creditEconomy.generationCosts.batch).toBeDefined();
  });

  it('has correct lightning mode costs', () => {
    expect(creditEconomy.generationCosts.lightning['1k']).toBe(30);
    expect(creditEconomy.generationCosts.lightning['2k']).toBe(60);
    expect(creditEconomy.generationCosts.lightning['4k']).toBe(120);
  });

  it('has correct snail mode costs', () => {
    expect(creditEconomy.generationCosts.snail['1k']).toBe(15);
    expect(creditEconomy.generationCosts.snail['2k']).toBe(30);
    expect(creditEconomy.generationCosts.snail['4k']).toBe(60);
  });

  it('snail mode is exactly 50% of lightning mode (business rule)', () => {
    const resolutions: Array<'1k' | '2k' | '4k'> = ['1k', '2k', '4k'];

    resolutions.forEach(res => {
      const lightningCost = creditEconomy.generationCosts.lightning[res];
      const snailCost = creditEconomy.generationCosts.snail[res];
      expect(snailCost).toBe(lightningCost / 2);
    });
  });

  it('has addonCosts defined', () => {
    expect(creditEconomy.addonCosts).toBeDefined();
    expect(typeof creditEconomy.addonCosts.titleGeneration).toBe('number');
    expect(typeof creditEconomy.addonCosts.fancyBackground).toBe('number');
  });
});
```

### 3. Add React Component Tests

**Create `src/components/pricing/__tests__/cost-breakdown.test.tsx`:**

```typescript
import { describe, it, expect } from 'bun:test';
import { render } from '@testing-library/react';
import { CostBreakdown } from '../cost-breakdown';

describe('CostBreakdown', () => {
  it('renders lightning mode costs correctly', () => {
    const { container } = render(
      <CostBreakdown resolution="1k" mode="lightning" />
    );

    expect(container.textContent).toContain('30 credits');
  });

  it('renders snail mode with discount', () => {
    const { container } = render(
      <CostBreakdown resolution="2k" mode="snail" />
    );

    expect(container.textContent).toContain('30 credits');
    expect(container.textContent).toContain('discount');
  });

  it('calculates discount percentage dynamically', () => {
    const { container } = render(
      <CostBreakdown resolution="1k" mode="snail" />
    );

    // Should show "50% off" calculated from (15 discount / 30 lightning) * 100
    expect(container.textContent).toMatch(/50%/);
  });
});
```

### 4. Update API Route Tests (if exists)

**Update `route.test.ts` for generate API:**

```typescript
describe('POST /api/generate', () => {
  it('calculates correct credits for lightning mode', async () => {
    const response = await POST(createRequest({
      resolution: '1k',
      mode: 'lightning',
      // ... other params
    }));

    // Verify credits consumed = 30
    expect(mockConsumeCredits).toHaveBeenCalledWith(
      expect.anything(),
      30,
      expect.anything()
    );
  });

  it('calculates correct credits for snail mode', async () => {
    const response = await POST(createRequest({
      resolution: '2k',
      mode: 'snail',
      // ... other params
    }));

    // Verify credits consumed = 30 (snail 2k)
    expect(mockConsumeCredits).toHaveBeenCalledWith(
      expect.anything(),
      30,
      expect.anything()
    );
  });

  it('defaults to lightning mode when mode not provided', async () => {
    const response = await POST(createRequest({
      resolution: '1k',
      // mode not provided
      // ... other params
    }));

    // Should consume 30 credits (lightning 1k)
    expect(mockConsumeCredits).toHaveBeenCalledWith(
      expect.anything(),
      30,
      expect.anything()
    );
  });

  it('returns cost breakdown in 402 error response', async () => {
    mockGetUserBalance.mockResolvedValue(10); // Insufficient

    const response = await POST(createRequest({
      resolution: '4k',
      mode: 'standard',
    }));

    expect(response.status).toBe(402);
    const data = await response.json();
    expect(data.costBreakdown).toBeDefined();
    expect(data.costBreakdown.total).toBe(120);
  });
});
```

## Test Coverage Requirements

Aim for 70-80% coverage on:
- `calculateGenerationCost()` - all branches (with/without addons)
- `getCreditsForGeneration()` - all mode/resolution combinations
- `CostBreakdown` component - rendering, dynamic discount calculation
- Config validation - Zod schema enforcement
- API credit calculation - both modes, addon support, database storage

## Acceptance Criteria

- [ ] All existing tests updated to use new credit values (30/60/120 and 15/30/60)
- [ ] New tests for `getCreditsForGeneration()` pass for both modes
- [ ] New tests for `calculateGenerationCost()` pass for both modes
- [ ] React component tests for `CostBreakdown` added and passing
- [ ] Config validation tests cover new structure (lightning/snail)
- [ ] Test enforces snail = 50% of lightning (documented as business rule)
- [ ] Tests verify addon cost calculations
- [ ] Tests verify addon type derivation from config
- [ ] API route tests verify mode parameter handling with Zod validation
- [ ] API route tests verify database storage of generation_mode and credits_charged
- [ ] API route tests verify cost breakdown in errors
- [ ] Test coverage is 70-80% or higher
- [ ] All tests pass with `bun test`
- [ ] No test failures or warnings

## Dependencies

**Requires completion of:**
- Task 01 - Update Configuration and Types
- Task 02 - Update API Routes

Tests must match the actual implementation to be meaningful.
