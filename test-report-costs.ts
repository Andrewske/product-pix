/**
 * Test what the report sees when summing costs
 */

import { config } from 'dotenv';
import { resolve } from 'node:path';
import { createAdminClient } from '@/lib/supabase/admin';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local'), override: true });

const testReportCosts = async (): Promise<void> => {
  const supabase = createAdminClient();
  const label = 'multi-angle-hybrid-20251216-9d1zqc';  // The batch from user's output

  console.log(`\n🔍 Testing report cost calculation for batch: ${label}\n`);

  // This is the same query used in report.ts:748-764
  const { data: tests, error } = await supabase
    .from('prompt_tests')
    .select(`
      id,
      final_prompt,
      image_url,
      source_image_url,
      status,
      duration_ms,
      cost_usd,
      prompt_evaluations (
        score_overall,
        details
      )
    `)
    .eq('batch_label', label)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Database error:', error.message);
    process.exit(1);
  }

  if (!tests || tests.length === 0) {
    console.log('No tests found');
    return;
  }

  console.log(`Found ${tests.length} tests\n`);

  // This is the same calculation used in report.ts:907
  const totalGenerationCost = tests.reduce((sum, t) => sum + (t.cost_usd || 0), 0);

  console.log(`Total generation cost (line 907 calculation):`);
  console.log(`  ${tests.length} tests × avg cost = $${totalGenerationCost.toFixed(6)}`);
  console.log(`  Formatted (4 decimals): $${totalGenerationCost.toFixed(4)}`);
  console.log('');

  // Show individual test costs  console.log(`Individual test costs:`);
  tests.forEach((t, i) => {
    console.log(`  Test ${i + 1}: cost_usd = ${t.cost_usd === null ? 'NULL' : `$${t.cost_usd.toFixed(6)}`}`);
  });

  // Check for null vs zero
  const nullCosts = tests.filter(t => t.cost_usd === null).length;
  const zeroCosts = tests.filter(t => t.cost_usd === 0).length;
  const nonZeroCosts = tests.filter(t => t.cost_usd && t.cost_usd > 0).length;

  console.log('');
  console.log(`Cost breakdown:`);
  console.log(`  - NULL: ${nullCosts}`);
  console.log(`  - Zero: ${zeroCosts}`);
  console.log(`  - Non-zero: ${nonZeroCosts}`);
};

testReportCosts().catch(console.error);
