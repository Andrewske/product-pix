import { createAdminClient } from '@/lib/supabase/admin';

async function checkTestData(): Promise<void> {
  const supabase = createAdminClient();

  console.log('=== Querying Test Data for batch: multi-angle-hybrid-20251217-axdo1w ===\n');

  // Query all tests from that batch
  const { data: tests, error } = await supabase
    .from('prompt_tests')
    .select('*')
    .eq('batch_label', 'multi-angle-hybrid-20251217-axdo1w')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error querying tests:', error);
    return;
  }

  if (!tests || tests.length === 0) {
    console.log('No tests found for this batch');
    return;
  }

  console.log(`Found ${tests.length} tests\n`);

  tests.forEach((test, i) => {
    console.log(`\n=== Test ${i + 1} ===`);
    console.log('ID:', test.id);
    console.log('Input tokens:', test.input_tokens);
    console.log('Output tokens:', test.output_tokens);
    console.log('Thinking tokens:', (test as any).thinking_tokens || 'N/A');
    console.log('Score:', test.score);
    console.log('Cost:', test.cost);
    console.log('Generated URL:', test.generated_url);
    console.log('Status:', test.status);
    console.log('Variables:', test.variables);
    console.log('Template:', test.template_slug);
    console.log('Created:', test.created_at);

    // Check if there are any unusual fields
    console.log('\nAll fields:', Object.keys(test).join(', '));
  });
}

checkTestData().catch(console.error);
