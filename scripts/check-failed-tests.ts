/**
 * Quick script to check failed test details
 */

require('dotenv').config({ path: '.env.local' });

import { createAdminClient } from '@/lib/supabase/admin';

const main = async () => {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('prompt_tests')
    .select('id, status, error_message, error_code, batch_label, created_at')
    .eq('batch_label', 'image-to-image-baseline')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Query failed:', error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('No tests found for batch: image-to-image-baseline');
    process.exit(0);
  }

  console.log(`\nFound ${data.length} test(s):\n`);

  for (const test of data) {
    console.log(`ID: ${test.id}`);
    console.log(`Status: ${test.status}`);
    console.log(`Created: ${test.created_at}`);

    if (test.error_code) {
      console.log(`Error Code: ${test.error_code}`);
    }

    if (test.error_message) {
      console.log(`Error: ${test.error_message}`);
    }

    console.log('---\n');
  }
};

main().catch(console.error);
