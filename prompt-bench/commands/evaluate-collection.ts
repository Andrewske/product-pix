/**
 * Evaluate Collection Command - Score image collections using AI evaluator
 */

import { parseArgs } from 'node:util';

import { createAdminClient } from '@/lib/supabase/admin';
import { loadConfig } from './shared';
import type { Json } from '@/types/database';

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

export const evaluateCollectionCommand = async (args: string[]): Promise<void> => {
  const options = parseEvaluateCollectionOptions(args);

  console.log(`\n🔍 Prompt Bench: Evaluate Collection`);
  console.log(`─────────────────────────────────────`);
  console.log(`Label: ${options.label}`);
  console.log(`Model: ${options.model}`);
  console.log(`─────────────────────────────────────\n`);

  const supabase = createAdminClient();

  // Group tests by test/product identifier
  // For now, we'll group by batch_label and assume all images in a batch are part of the same collection
  // In the future, this could be enhanced to group by product_id or other criteria
  const { data: tests, error } = await supabase
    .from('prompt_tests')
    .select('id, image_url, final_prompt, batch_label')
    .eq('batch_label', options.label)
    .eq('status', 'completed')
    .order('created_at', { ascending: true });

  if (error) {
    console.error(`Database error: ${error.message}`);
    process.exit(1);
  }

  if (!tests || tests.length === 0) {
    console.log(`No completed tests found for label "${options.label}"`);
    return;
  }

  console.log(`📋 Found ${tests.length} completed tests for collection evaluation\n`);

  // Group images by collection (for now, all images in the batch are one collection)
  const collections = [{
    label: options.label,
    images: tests.map(test => ({ id: test.id, url: test.image_url, prompt: test.final_prompt })),
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
    const validImages = collection.images.filter(img => img.url);
    if (validImages.length !== collection.images.length) {
      console.log(`  ⏭️  Skipping (${collection.images.length - validImages.length} images missing URLs)`);
      continue;
    }

    const result = await evaluateCollection(
      validImages.map(img => ({ type: 'url' as const, value: img.url! })),
      {
        model: options.model,
      }
    );

    if (!result.ok) {
      console.log(`  ❌ Failed: ${result.error.message}`);
      failed++;
      continue;
    }

    // Save collection evaluation results
    // For now, we'll store this as a single record per collection
    // In the future, we might want a separate collection_evaluations table
    const evaluationData = {
      consistency: result.data.consistency,
      variety: result.data.variety,
      physicalPlausibility: result.data.physicalPlausibility,
      reasoning: result.data.reasoning,
      suggestions: result.data.suggestions,
    };

    // Update each test with collection evaluation data
    for (const image of validImages) {
      const { error: updateError } = await supabase
        .from('prompt_evaluations')
        .update({
          // Store collection metrics in the existing details JSONB field
          details: {
            ...evaluationData,
            collectionOverall: result.data.overall,
          } as Json,
          evaluator_model: result.data.model,
          cost_usd: (result.data.costUsd / validImages.length), // Split cost across images
          tokens_used: Math.round(result.data.tokensUsed / validImages.length), // Split tokens across images
        })
        .eq('test_id', image.id);

      if (updateError) {
        console.log(`  ⚠️  Failed to update evaluation for test ${image.id}: ${updateError.message}`);
      }
    }

    console.log(`  ✅ Collection Score: ${result.data.overall.toFixed(1)}/10`);
    console.log(`     Consistency: ${result.data.consistency}/10`);
    console.log(`     Variety: ${result.data.variety}/10`);
    console.log(`     Physical Plausibility: ${result.data.physicalPlausibility}/10`);
    completed++;
  }

  // Summary
  console.log(`\n─────────────────────────────────────`);
  console.log(`📊 Results:`);
  console.log(`   Collections Evaluated: ${completed}`);
  console.log(`   Failed: ${failed}`);
  console.log(`─────────────────────────────────────\n`);

  console.log(`Next steps:`);
  console.log(`  npm run bench report --label "${options.label}"`);
};