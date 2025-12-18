import { createAdminClient } from '@/lib/supabase/admin';

const supabase = createAdminClient();
const { error } = await supabase.from('analysis_cache').delete().neq('images_hash', '');

if (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}

console.log('✅ Analysis cache cleared');
