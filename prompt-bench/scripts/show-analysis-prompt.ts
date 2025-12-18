#!/usr/bin/env bun
import { createAdminClient } from '@/lib/supabase/admin';

const supabase = createAdminClient();

const { data, error } = await supabase
  .from('analysis_prompts')
  .select('*')
  .eq('slug', 'product-analysis')
  .order('version', { ascending: false })
  .limit(1)
  .single();

if (error) {
  console.error('Error:', error);
  process.exit(1);
}

console.log('Current Analysis Prompt:');
console.log('========================\n');
console.log(`Slug:    ${data.slug}`);
console.log(`Version: ${data.version}`);
console.log(`Status:  ${data.status}\n`);
console.log('Prompt Text:');
console.log('─'.repeat(80));
console.log(data.prompt_text);
console.log('─'.repeat(80));
