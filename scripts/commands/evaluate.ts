/**
 * Evaluate Command - Score generated images using LLM evaluator
 */

import { parseArgs } from 'node:util';

import { createAdminClient } from '@/lib/supabase/admin';
import { loadConfig } from './shared';
import type { Json } from '@/types/database';

interface EvaluateOptions {
  label: string;
  model: string;
}

const parseEvaluateOptions = (args: string[]): EvaluateOptions => {
  const config = loadConfig();

  const { values } = parseArgs({
    args,
    options: {
      label: { type: 'string', short: 'l' },
      model: { type: 'string', short: 'm' },
    },
  });

  if (!values.label) {
    console.error('--label is required');
    process.exit(1);
  }

  return {
    label: values.label,
    model: values.model || config?.defaults.evaluation_model || 'claude-sonnet-4-20250514',
  };
};

export const evaluateCommand = async (args: string[]): Promise<void> => {
  const options = parseEvaluateOptions(args);

  console.log(`\n🔍 Prompt Bench: Evaluate`);
  console.log(`─────────────────────────────────`);
  console.log(`Label: ${options.label}`);
  console.log(`Model: ${options.model}`);
  console.log(`─────────────────────────────────\n`);

  const supabase = createAdminClient();

  // Fetch tests that need evaluation
  const { data: tests, error } = await supabase
    .from('prompt_tests')
    .select('id, image_url, final_prompt')
    .eq('batch_label', options.label)
    .eq('status', 'evaluating')
    .order('created_at', { ascending: true });

  if (error) {
    console.error(`Database error: ${error.message}`);
    process.exit(1);
  }

  if (!tests || tests.length === 0) {
    console.log(`No tests found for label "${options.label}" with status "evaluating"`);
    return;
  }

  console.log(`📋 Found ${tests.length} tests to evaluate\n`);

  const { evaluateImage } = await import('@/lib/prompts/evaluator');

  let completed = 0;
  let failed = 0;

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`[${i + 1}/${tests.length}] Evaluating...`);

    if (!test.image_url) {
      console.log(`  ⏭️  Skipping (no image URL)`);
      continue;
    }

    const result = await evaluateImage(test.image_url, test.final_prompt, {
      model: options.model,
    });

    if (!result.ok) {
      console.log(`  ❌ Failed: ${result.error.message}`);
      failed++;
      continue;
    }

    // Save evaluation
    const { error: insertError } = await supabase.from('prompt_evaluations').insert({
      test_id: test.id,
      score_overall: result.data.overall,
      details: result.data.details as Json,
      evaluator_model: result.data.model,
      evaluator_type: 'llm',
      cost_usd: result.data.costUsd,
      tokens_used: result.data.tokensUsed,
    });

    if (insertError) {
      console.log(`  ❌ Database error: ${insertError.message}`);
      failed++;
      continue;
    }

    // Update test status
    const { error: rpcError } = await supabase.rpc('update_prompt_test_status', {
      p_test_id: test.id,
      p_new_status: 'completed',
    });
    if (rpcError) {
      console.error(`  ⚠️  Failed to update status: ${rpcError.message}`);
    }

    console.log(`  ✅ Score: ${result.data.overall.toFixed(1)}/10`);
    completed++;
  }

  // Summary
  console.log(`\n─────────────────────────────────`);
  console.log(`📊 Results:`);
  console.log(`   Evaluated: ${completed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`─────────────────────────────────\n`);

  console.log(`Next steps:`);
  console.log(`  npm run bench report --label "${options.label}"`);
};
