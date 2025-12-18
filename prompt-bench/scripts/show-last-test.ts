#!/usr/bin/env bun
import { createAdminClient } from '@/lib/supabase/admin';

const supabase = createAdminClient();

const { data, error } = await supabase
  .from('prompt_tests')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(2);

if (error) {
  console.error('Error:', error);
  process.exit(1);
}

console.log('Last 2 generated tests:\n');
data?.forEach((test, idx) => {
  console.log(`\n${idx + 1}. Test ID: ${test.id}`);
  console.log(`   Status: ${test.status}`);
  console.log(`   Image: ${test.image_url}`);
  console.log(`   Prompt:`);
  console.log('   ' + '-'.repeat(76));
  console.log(`   ${test.final_prompt.replace(/\n/g, '\n   ')}`);
  console.log('   ' + '-'.repeat(76));
});
