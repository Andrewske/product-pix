/**
 * Delete failed test to allow re-run
 */

require('dotenv').config({ path: '.env.local' });

import { createAdminClient } from '@/lib/supabase/admin';

const main = async () => {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('prompt_tests')
    .delete()
    .eq('batch_label', 'image-to-image-baseline')
    .eq('status', 'failed')
    .select();

  if (error) {
    console.error('Delete failed:', error);
    process.exit(1);
  }

  console.log(`\n✅ Deleted ${data?.length || 0} failed test(s)\n`);
};

main().catch(console.error);
