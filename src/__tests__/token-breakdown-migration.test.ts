import { describe, it, expect } from 'bun:test';
import type { Database } from '@/types/database';

describe('Token Breakdown Migration Tests', () => {
  describe('TypeScript type definitions', () => {
    it('should include input_tokens and output_tokens in prompt_evaluations Row type', () => {
      // Test that the TypeScript types include the new columns
      const row: Database['public']['Tables']['prompt_evaluations']['Row'] = {
        id: 'test-id',
        evaluator_type: 'llm',
        score_overall: 8.5,
        tokens_used: 100,
        input_tokens: 60,  // New column
        output_tokens: 40,  // New column
        created_at: new Date().toISOString(),
        cost_usd: null,
        details: null,
        evaluator_model: null,
        test_id: null,
      };

      expect(row.input_tokens).toBe(60);
      expect(row.output_tokens).toBe(40);
      expect(row.tokens_used).toBe(100);
    });

    it('should allow NULL values for input_tokens and output_tokens in Row type', () => {
      const row: Database['public']['Tables']['prompt_evaluations']['Row'] = {
        id: 'test-id',
        evaluator_type: 'llm',
        score_overall: 8.5,
        tokens_used: 100,
        input_tokens: null,  // Can be null
        output_tokens: null,  // Can be null
        created_at: new Date().toISOString(),
        cost_usd: null,
        details: null,
        evaluator_model: null,
        test_id: null,
      };

      expect(row.input_tokens).toBeNull();
      expect(row.output_tokens).toBeNull();
      expect(row.tokens_used).toBe(100);
    });

    it('should include input_tokens and output_tokens in Insert type', () => {
      const insertData: Database['public']['Tables']['prompt_evaluations']['Insert'] = {
        evaluator_type: 'llm',
        score_overall: 8.5,
        tokens_used: 100,
        input_tokens: 60,  // Optional in Insert
        output_tokens: 40,  // Optional in Insert
      };

      expect(insertData.input_tokens).toBe(60);
      expect(insertData.output_tokens).toBe(40);
      expect(insertData.tokens_used).toBe(100);
    });

    it('should allow undefined values for input_tokens and output_tokens in Insert type', () => {
      const insertData: Database['public']['Tables']['prompt_evaluations']['Insert'] = {
        evaluator_type: 'llm',
        score_overall: 8.5,
        tokens_used: 100,
        // input_tokens and output_tokens can be omitted
      };

      expect(insertData.input_tokens).toBeUndefined();
      expect(insertData.output_tokens).toBeUndefined();
      expect(insertData.tokens_used).toBe(100);
    });

    it('should include input_tokens and output_tokens in Update type', () => {
      const updateData: Database['public']['Tables']['prompt_evaluations']['Update'] = {
        input_tokens: 70,  // Can update
        output_tokens: 30,  // Can update
      };

      expect(updateData.input_tokens).toBe(70);
      expect(updateData.output_tokens).toBe(30);
    });
  });

  describe('backward compatibility', () => {
    it('should retain tokens_used column in all type definitions', () => {
      // Row type should have tokens_used
      const row: Database['public']['Tables']['prompt_evaluations']['Row'] = {
        id: 'test-id',
        evaluator_type: 'llm',
        score_overall: 8.5,
        tokens_used: 100,  // Still required
        input_tokens: null,
        output_tokens: null,
        created_at: new Date().toISOString(),
        cost_usd: null,
        details: null,
        evaluator_model: null,
        test_id: null,
      };

      expect(row.tokens_used).toBe(100);

      // Insert type should allow tokens_used
      const insertData: Database['public']['Tables']['prompt_evaluations']['Insert'] = {
        evaluator_type: 'llm',
        score_overall: 8.5,
        tokens_used: 100,  // Still supported
      };

      expect(insertData.tokens_used).toBe(100);
    });

    it('should support legacy records without token breakdown', () => {
      // Can create records with only tokens_used (legacy style)
      const legacyInsert: Database['public']['Tables']['prompt_evaluations']['Insert'] = {
        evaluator_type: 'llm',
        score_overall: 8.5,
        tokens_used: 100,  // Only total available
        // input_tokens and output_tokens can be omitted
      };

      expect(legacyInsert.tokens_used).toBe(100);
      expect(legacyInsert.input_tokens).toBeUndefined();
      expect(legacyInsert.output_tokens).toBeUndefined();
    });
  });

  describe('data integrity', () => {
    it('should validate token breakdown consistency', () => {
      // Test that input + output can equal tokens_used
      const inputTokens = 60;
      const outputTokens = 40;
      const totalTokens = inputTokens + outputTokens;

      const evaluation: Database['public']['Tables']['prompt_evaluations']['Row'] = {
        id: 'test-id',
        evaluator_type: 'llm',
        score_overall: 8.5,
        tokens_used: totalTokens,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        created_at: new Date().toISOString(),
        cost_usd: null,
        details: null,
        evaluator_model: null,
        test_id: null,
      };

      expect(evaluation.input_tokens! + evaluation.output_tokens!).toBe(evaluation.tokens_used!);
    });

    it('should handle cases where token breakdown is not available', () => {
      // Test NULL handling
      const evaluation: Database['public']['Tables']['prompt_evaluations']['Row'] = {
        id: 'test-id',
        evaluator_type: 'llm',
        score_overall: 8.5,
        tokens_used: 100,
        input_tokens: null,  // Breakdown not available
        output_tokens: null,  // Breakdown not available
        created_at: new Date().toISOString(),
        cost_usd: null,
        details: null,
        evaluator_model: null,
        test_id: null,
      };

      expect(evaluation.input_tokens).toBeNull();
      expect(evaluation.output_tokens).toBeNull();
      expect(evaluation.tokens_used).toBe(100);
    });
  });
});