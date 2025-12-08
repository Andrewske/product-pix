# Task 09: Create Tests

## Objective
Create comprehensive tests for the iteration system modules.

## Files to Create

### 1. prompt-bench/__tests__/iteration-types.test.ts

Test Zod schema validation:

```typescript
import { describe, it, expect } from 'bun:test';
import {
  PromptVariationSchema,
  IterationStateSchema,
  IterationConfigSchema,
  MutationTypeSchema,
  VariationSourceSchema,
} from '@bench/core/iteration-types';

describe('iteration-types', () => {
  describe('MutationTypeSchema', () => {
    it('accepts valid mutation types', () => {
      expect(MutationTypeSchema.parse('wording')).toBe('wording');
      expect(MutationTypeSchema.parse('wild')).toBe('wild');
    });

    it('rejects invalid mutation types', () => {
      expect(() => MutationTypeSchema.parse('invalid')).toThrow();
    });
  });

  describe('PromptVariationSchema', () => {
    it('validates complete variation', () => {
      const variation = {
        id: 'var-123',
        parentIds: ['parent-1'],
        source: 'mutation',
        mutationType: 'wording',
        templateData: {
          subject: 'Test subject',
          background: 'white background',
        },
        rationale: 'Test rationale',
        confidence: 0.8,
      };
      expect(PromptVariationSchema.parse(variation)).toMatchObject(variation);
    });

    it('rejects confidence out of range', () => {
      const variation = {
        id: 'var-123',
        parentIds: [],
        source: 'wild',
        templateData: { subject: 'Test' },
        rationale: 'Test',
        confidence: 1.5, // Invalid
      };
      expect(() => PromptVariationSchema.parse(variation)).toThrow();
    });
  });

  describe('IterationConfigSchema', () => {
    it('applies defaults', () => {
      const config = IterationConfigSchema.parse({});
      expect(config.populationSize).toBe(8);
      expect(config.maxGenerations).toBe(10);
    });
  });
});
```

### 2. prompt-bench/__tests__/state.test.ts

Test state management:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdir, rm } from 'node:fs/promises';
import {
  createSession,
  saveSession,
  loadSession,
  listSessions,
  deleteSession,
} from '@bench/core/state';

const TEST_SESSIONS_DIR = 'prompt-bench/sessions-test';

describe('state management', () => {
  beforeEach(async () => {
    await mkdir(TEST_SESSIONS_DIR, { recursive: true });
  });

  afterEach(async () => {
    await rm(TEST_SESSIONS_DIR, { recursive: true, force: true });
  });

  describe('createSession', () => {
    it('creates session with defaults', () => {
      const session = createSession('test-template', 1);

      expect(session.sessionId).toMatch(/^[0-9a-f-]{36}$/);
      expect(session.templateSlug).toBe('test-template');
      expect(session.templateVersion).toBe(1);
      expect(session.generations).toEqual([]);
      expect(session.config.populationSize).toBe(8);
    });

    it('creates session with custom config', () => {
      const session = createSession('test-template', 1, {
        populationSize: 12,
        maxGenerations: 5,
      });

      expect(session.config.populationSize).toBe(12);
      expect(session.config.maxGenerations).toBe(5);
    });
  });

  describe('saveSession / loadSession', () => {
    it('round-trips session state', async () => {
      const session = createSession('test-template', 1);

      const saveResult = await saveSession(session);
      expect(saveResult.ok).toBe(true);

      const loadResult = await loadSession(session.sessionId);
      expect(loadResult.ok).toBe(true);
      if (loadResult.ok) {
        expect(loadResult.data.sessionId).toBe(session.sessionId);
        expect(loadResult.data.templateSlug).toBe('test-template');
      }
    });

    it('returns error for non-existent session', async () => {
      const result = await loadSession('non-existent-id');
      expect(result.ok).toBe(false);
    });
  });

  describe('listSessions', () => {
    it('lists all sessions', async () => {
      const s1 = createSession('template-1', 1);
      const s2 = createSession('template-2', 1);

      await saveSession(s1);
      await saveSession(s2);

      const result = await listSessions();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.length).toBe(2);
      }
    });
  });
});
```

### 3. prompt-bench/__tests__/convergence.test.ts

Test convergence detection:

```typescript
import { describe, it, expect } from 'bun:test';
import {
  checkConvergence,
  calculateImprovementRate,
  estimateGenerationsToTarget,
} from '@bench/core/convergence';
import type { IterationState } from '@bench/core/iteration-types';

const createMockState = (overrides: Partial<IterationState> = {}): IterationState => ({
  sessionId: 'test-session',
  templateSlug: 'test-template',
  templateVersion: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  generations: [],
  currentPopulation: [],
  scoreHistory: [],
  config: {
    populationSize: 8,
    eliteCount: 2,
    mutationRate: 0.6,
    crossoverRate: 0.3,
    wildRate: 0.1,
    convergenceThreshold: 0.05,
    maxGenerations: 10,
  },
  ...overrides,
});

describe('convergence', () => {
  describe('checkConvergence', () => {
    it('returns not converged for empty state', () => {
      const state = createMockState();
      const result = checkConvergence(state);

      expect(result.converged).toBe(false);
    });

    it('detects max generations reached', () => {
      const state = createMockState({
        generations: Array(10).fill({ generation: 0, batchLabel: '', variations: [] }),
        scoreHistory: Array(10).fill({ generation: 0, best: 8, mean: 7.5, stdDev: 0.5 }),
      });

      const result = checkConvergence(state);

      expect(result.converged).toBe(true);
      expect(result.reason).toBe('max_generations');
    });

    it('detects stddev threshold', () => {
      const state = createMockState({
        scoreHistory: [
          { generation: 1, best: 9.0, mean: 8.8, stdDev: 0.03 }, // Below 0.05 threshold
        ],
      });

      const result = checkConvergence(state);

      expect(result.converged).toBe(true);
      expect(result.reason).toBe('stddev_threshold');
    });

    it('detects plateau', () => {
      const state = createMockState({
        scoreHistory: [
          { generation: 1, best: 8.5, mean: 8.0, stdDev: 0.3 },
          { generation: 2, best: 8.5, mean: 8.1, stdDev: 0.25 },
          { generation: 3, best: 8.5, mean: 8.1, stdDev: 0.2 },
          { generation: 4, best: 8.5, mean: 8.1, stdDev: 0.15 }, // No improvement in best for 3 gens
        ],
      });

      const result = checkConvergence(state);

      expect(result.converged).toBe(true);
      expect(result.reason).toBe('plateau');
    });

    it('detects target reached', () => {
      const state = createMockState({
        scoreHistory: [
          { generation: 1, best: 9.5, mean: 9.0, stdDev: 0.3 },
        ],
      });

      const result = checkConvergence(state, 9.5);

      expect(result.converged).toBe(true);
      expect(result.reason).toBe('target_reached');
    });
  });

  describe('calculateImprovementRate', () => {
    it('calculates average improvement', () => {
      const history = [
        { generation: 1, best: 7.0, mean: 6.5, stdDev: 0.5 },
        { generation: 2, best: 7.5, mean: 7.0, stdDev: 0.4 },
        { generation: 3, best: 8.0, mean: 7.5, stdDev: 0.3 },
      ];

      const rate = calculateImprovementRate(history);

      expect(rate).toBeCloseTo(0.5, 2); // 0.5 improvement per generation
    });

    it('returns 0 for insufficient history', () => {
      const history = [{ generation: 1, best: 7.0, mean: 6.5, stdDev: 0.5 }];

      const rate = calculateImprovementRate(history);

      expect(rate).toBe(0);
    });
  });

  describe('estimateGenerationsToTarget', () => {
    it('estimates based on improvement rate', () => {
      const state = createMockState({
        scoreHistory: [
          { generation: 1, best: 7.0, mean: 6.5, stdDev: 0.5 },
          { generation: 2, best: 7.5, mean: 7.0, stdDev: 0.4 },
          { generation: 3, best: 8.0, mean: 7.5, stdDev: 0.3 },
        ],
      });

      const estimate = estimateGenerationsToTarget(state, 9.5);

      expect(estimate).toBe(3); // Need 1.5 more, at 0.5/gen = 3 generations
    });

    it('returns null if regressing', () => {
      const state = createMockState({
        scoreHistory: [
          { generation: 1, best: 8.0, mean: 7.5, stdDev: 0.5 },
          { generation: 2, best: 7.5, mean: 7.0, stdDev: 0.4 },
          { generation: 3, best: 7.0, mean: 6.5, stdDev: 0.3 },
        ],
      });

      const estimate = estimateGenerationsToTarget(state, 9.0);

      expect(estimate).toBeNull();
    });
  });
});
```

### 4. prompt-bench/__tests__/evolution.test.ts

Test evolution operators:

```typescript
import { describe, it, expect, mock } from 'bun:test';
import {
  selectParents,
  evolvePopulation,
} from '@bench/core/evolution';
import type { IterationState, StructuredInsight } from '@bench/core/iteration-types';

describe('evolution', () => {
  describe('selectParents', () => {
    it('selects from population using tournament', () => {
      const population = [
        { variationId: 'a', fitness: 0.9, generation: 1 },
        { variationId: 'b', fitness: 0.7, generation: 1 },
        { variationId: 'c', fitness: 0.5, generation: 1 },
        { variationId: 'd', fitness: 0.3, generation: 1 },
      ];

      const parents = selectParents(population, 2);

      expect(parents.length).toBe(2);
      expect(parents.every(p => ['a', 'b', 'c', 'd'].includes(p))).toBe(true);
    });

    it('favors higher fitness', () => {
      const population = [
        { variationId: 'high', fitness: 0.99, generation: 1 },
        { variationId: 'low', fitness: 0.01, generation: 1 },
      ];

      // Run multiple times to verify bias
      const selections = Array(100).fill(null).map(() => selectParents(population, 1)[0]);
      const highCount = selections.filter(s => s === 'high').length;

      expect(highCount).toBeGreaterThan(70); // Should heavily favor 'high'
    });
  });

  // Note: evolvePopulation tests would require mocking the Anthropic API
  // Consider using dependency injection for testability
});
```

## Running Tests

```bash
# Run all iteration tests
bun test prompt-bench/__tests__/iteration
bun test prompt-bench/__tests__/state
bun test prompt-bench/__tests__/convergence
bun test prompt-bench/__tests__/evolution

# Run all tests
bun test
```

## Test Coverage Goals
- iteration-types: 100% schema validation coverage
- state: 90%+ for CRUD operations
- convergence: 100% for all stopping conditions
- evolution: 80%+ (API calls mocked)
