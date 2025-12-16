/**
 * Check what cost_usd values are actually in the database
 */

import { config } from 'dotenv';
import { resolve } from 'node:path';
import { createAdminClient } from '@/lib/supabase/admin';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local'), override: true });

const checkCosts = async (): Promise<void> => {
  const supabase = createAdminClient();

  console.log('\n🔍 Checking database for generation costs\n');

  // Get recent tests with their cost data
  const { data: tests, error } = await supabase
    .from('prompt_tests')
    .select('id, batch_label, cost_usd, input_tokens, output_tokens, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('❌ Database error:', error.message);
    process.exit(1);
  }

  if (!tests || tests.length === 0) {
    console.log('No tests found in database');
    return;
  }

  console.log(`Found ${tests.length} recent tests:\n`);

  // Group by batch_label
  const byBatch = tests.reduce((acc, test) => {
    const label = test.batch_label || 'unlabeled';
    if (!acc[label]) acc[label] = [];
    acc[label].push(test);
    return acc;
  }, {} as Record<string, typeof tests>);

  for (const [label, batchTests] of Object.entries(byBatch)) {
    console.log(`📦 Batch: ${label} (${batchTests.length} tests)`);

    let totalCost = 0;
    let nullCosts = 0;
    let zeroCosts = 0;
    let nonZeroCosts = 0;

    for (const test of batchTests) {
      if (test.cost_usd === null) {
        nullCosts++;
      } else if (test.cost_usd === 0) {
        zeroCosts++;
      } else {
        nonZeroCosts++;
        totalCost += test.cost_usd;
      }
    }

    console.log(`  - Null costs: ${nullCosts}`);
    console.log(`  - Zero costs: ${zeroCosts}`);
    console.log(`  - Non-zero costs: ${nonZeroCosts}`);
    console.log(`  - Total cost: $${totalCost.toFixed(6)}`);

    if (nonZeroCosts > 0) {
      console.log(`\n  Sample non-zero costs:`);
      batchTests
        .filter(t => t.cost_usd && t.cost_usd > 0)
        .slice(0, 3)
        .forEach(t => {
          console.log(`    - ID ${t.id.slice(0, 8)}: $${t.cost_usd?.toFixed(6)} (${t.input_tokens} in, ${t.output_tokens} out)`);
        });
    }

    console.log('');
  }
};

checkCosts().catch(console.error);
