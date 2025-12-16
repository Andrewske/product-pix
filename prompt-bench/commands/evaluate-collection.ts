/**
 * Evaluate Collection Command - Score image collections using AI evaluator
 */

import { parseArgs } from 'node:util';

import { createAdminClient } from '@/lib/supabase/admin';
import { loadConfig } from './shared';
import type { Json } from '@/types/database';
import type { Result } from '@bench/core/errors';
import type { CollectionEvaluationResult } from '@bench/core/collection-evaluator';
import type { SupabaseClient } from '@supabase/supabase-js';

interface EvaluateCollectionOptions {
  label: string;
  model: string;
}

const parseEvaluateCollectionOptions = (args: string[]): EvaluateCollectionOptions => {
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

interface CollectionData {
  label: string;
  images: Array<{ id: string; image_url: string; final_prompt: string }>;
}

export const executeCollectionEvaluation = async (
  supabase: SupabaseClient,
  validImages: Array<{ id: string; image_url: string; final_prompt: string }>,
  evaluationResult: CollectionEvaluationResult
): Promise<Result<void>> => {
  // Prepare evaluation data
  const evaluationData = {
    consistency: evaluationResult.consistency,
    variety: evaluationResult.variety,
    physicalPlausibility: evaluationResult.physicalPlausibility,
    reasoning: evaluationResult.reasoning,
    suggestions: evaluationResult.suggestions,
  };

  // Update each test with collection evaluation data
  for (const image of validImages) {
    const { error: updateError } = await supabase
      .from('prompt_evaluations')
      .update({
        details: {
          ...evaluationData,
          collectionOverall: evaluationResult.overall,
        } as Json,
        evaluator_model: evaluationResult.model,
        cost_usd: (evaluationResult.costUsd / validImages.length),
        tokens_used: Math.round(evaluationResult.tokensUsed / validImages.length),
        input_tokens: Math.round(evaluationResult.inputTokens / validImages.length),
        output_tokens: Math.round(evaluationResult.outputTokens / validImages.length),
      })
      .eq('test_id', image.id);

    if (updateError) {
      return { ok: false, error: { type: 'database', message: `Failed to update evaluation for test ${image.id}: ${updateError.message}`, location: 'executeCollectionEvaluation.updateEvaluation' } };
    }
  }

  return { ok: true, data: undefined };
};

const evaluateCollections = async (
  supabase: SupabaseClient,
  label: string,
  model: string
): Promise<Result<{ completed: number; failed: number; testCount: number }>> => {
  // Fetch tests from database
  const { data: tests, error } = await supabase
    .from('prompt_tests')
    .select('id, image_url, final_prompt, batch_label')
    .eq('batch_label', label)
    .eq('status', 'completed')
    .order('created_at', { ascending: true });

  if (error) {
    return { ok: false, error: { type: 'database', message: error.message, location: 'evaluateCollections.fetchTests' } };
  }

  if (!tests || tests.length === 0) {
    return { ok: false, error: { type: 'validation', message: `No completed tests found for label "${label}"`, location: 'evaluateCollections.noTests' } };
  }

  // Group images by collection (for now, all images in the batch are one collection)
  const collections = [{
    label,
    images: tests.map(test => ({ id: test.id, image_url: test.image_url, final_prompt: test.final_prompt })),
  }];

  const { evaluateCollection } = await import('@bench/core/collection-evaluator');

  let completed = 0;
  let failed = 0;

  for (const collection of collections) {
    console.log(`[${collection.label}] Evaluating collection with ${collection.images.length} images...`);

    if (collection.images.length < 2) {
      console.log(`  ⏭️  Skipping (need at least 2 images for collection evaluation)`);
      continue;
    }

    if (collection.images.length > 10) {
      console.log(`  ⏭️  Skipping (maximum 10 images per collection)`);
      continue;
    }

    // Check for missing image URLs
    const validImages = collection.images.filter(img => img.image_url);
    if (validImages.length !== collection.images.length) {
      console.log(`  ⏭️  Skipping (${collection.images.length - validImages.length} images missing URLs)`);
      continue;
    }

    const result = await evaluateCollection(
      validImages.map(img => ({ type: 'url' as const, value: img.image_url! })),
      { model }
    );

    if (!result.ok) {
      console.log(`  ❌ Failed: ${result.error.message}`);
      failed++;
      continue;
    }

    // Execute database operations
    const dbResult = await executeCollectionEvaluation(supabase, validImages, result.data);

    if (!dbResult.ok) {
      console.log(`  ⚠️  Failed to update evaluations: ${dbResult.error.message}`);
      failed++;
      continue;
    }

    console.log(`  ✅ Collection Score: ${result.data.overall.toFixed(1)}/10`);
    console.log(`     Consistency: ${result.data.consistency}/10`);
    console.log(`     Variety: ${result.data.variety}/10`);
    console.log(`     Physical Plausibility: ${result.data.physicalPlausibility}/10`);
    completed++;
  }

  return { ok: true, data: { completed, failed, testCount: tests.length } };
};

export const evaluateCollectionCommand = async (args: string[]): Promise<void> => {
  const options = parseEvaluateCollectionOptions(args);

  console.log(`\n🔍 Prompt Bench: Evaluate Collection`);
  console.log(`─────────────────────────────────────`);
  console.log(`Label: ${options.label}`);
  console.log(`Model: ${options.model}`);
  console.log(`─────────────────────────────────────\n`);

  const supabase = createAdminClient();

  const result = await evaluateCollections(supabase, options.label, options.model);

  if (!result.ok) {
    if (result.error.type === 'validation' && result.error.message.includes('No completed tests found')) {
      console.log(result.error.message);
      return;
    }
    console.error(`Error: ${result.error.message}`);
    process.exit(1);
  }

  console.log(`📋 Found ${result.data.testCount} completed tests for collection evaluation\n`);

  // Summary
  console.log(`\n─────────────────────────────────────`);
  console.log(`📊 Results:`);
  console.log(`   Collections Evaluated: ${result.data.completed}`);
  console.log(`   Failed: ${result.data.failed}`);
  console.log(`─────────────────────────────────────\n`);

  console.log(`Next steps:`);
  console.log(`  npm run bench report --label "${options.label}"`);
};