/**
 * Report Command Tests
 */

import { describe, it, expect } from 'bun:test';
import { prepareTestCostData } from '../commands/report';

describe('prepareTestCostData', () => {
  it('transforms test data into cost breakdown rows', () => {
    const mockTests = [
      {
        id: 'test-1',
        cost_usd: 0.001,
        input_tokens: 100,
        output_tokens: 200,
        prompt_evaluations: [
          {
            score_overall: 8.5,
            cost_usd: 0.009,
            input_tokens: 150,
            output_tokens: 50,
            evaluator_model: 'claude-sonnet-4',
          }
        ]
      }
    ];

    const result = prepareTestCostData(mockTests);

    expect(result).toHaveLength(1);
    expect(result[0].testId).toBe('test-1');
    expect(result[0].testNumber).toBe(1);
    expect(result[0].score).toBe(8.5);
    expect(result[0].genModel).toBeNull();
    expect(result[0].genInputTokens).toBe(100);
    expect(result[0].genOutputTokens).toBe(200);
    expect(result[0].evalModel).toBe('claude-sonnet-4');
    expect(result[0].evalInputTokens).toBe(150);
    expect(result[0].evalOutputTokens).toBe(50);
    expect(typeof result[0].genInputCost).toBe('number');
    expect(typeof result[0].evalTotalCost).toBe('number');
  });

  it('handles missing evaluation data', () => {
    const mockTests = [
      {
        id: 'test-1',
        cost_usd: 0.001,
        input_tokens: 100,
        output_tokens: 200,
        prompt_evaluations: null
      }
    ];

    const result = prepareTestCostData(mockTests);

    expect(result[0].score).toBe(0);
    expect(result[0].evalModel).toBeNull();
    expect(result[0].evalInputTokens).toBeNull();
    expect(result[0].evalOutputTokens).toBeNull();
    expect(result[0].evalTotalCost).toBe(0);
  });

  it('handles missing token data', () => {
    const mockTests = [
      {
        id: 'test-1',
        cost_usd: 0.001,
        input_tokens: null,
        output_tokens: null,
        prompt_evaluations: [
          {
            score_overall: 8.5,
            cost_usd: 0.009,
            input_tokens: null,
            output_tokens: null,
            evaluator_model: 'claude-sonnet-4',
          }
        ]
      }
    ];

    const result = prepareTestCostData(mockTests);

    expect(result[0].genInputTokens).toBeNull();
    expect(result[0].genOutputTokens).toBeNull();
    expect(result[0].genTotalCost).toBe(0.001); // Uses stored cost
    expect(result[0].evalInputTokens).toBeNull();
    expect(result[0].evalOutputTokens).toBeNull();
    expect(result[0].evalTotalCost).toBe(0.009); // Uses stored cost
  });

  it('calculates total cost correctly', () => {
    const mockTests = [
      {
        id: 'test-1',
        cost_usd: 0.001,
        input_tokens: null,
        output_tokens: null,
        prompt_evaluations: [
          {
            score_overall: 7.0,
            cost_usd: 0.002,
            input_tokens: null,
            output_tokens: null,
            evaluator_model: 'claude-sonnet-4',
          }
        ]
      }
    ];

    const result = prepareTestCostData(mockTests);

    expect(result[0].totalCost).toBe(0.003); // gen + eval
  });
});