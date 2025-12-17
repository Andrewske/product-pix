import { createAdminClient } from '@/lib/supabase/admin';

async function checkTest1Detail(): Promise<void> {
  const supabase = createAdminClient();

  console.log('=== Detailed Test 1 Data ===\n');

  const { data: test, error } = await supabase
    .from('prompt_tests')
    .select('*')
    .eq('id', '229965f3-668f-49cd-90f3-ddbf58ed12cf')
    .single();

  if (error) {
    console.error('Error querying test:', error);
    return;
  }

  if (!test) {
    console.log('Test not found');
    return;
  }

  console.log('Full test object:');
  console.log(JSON.stringify(test, null, 2));

  console.log('\n\n=== Key Fields ===');
  console.log('Final prompt length:', test.final_prompt?.length || 0, 'characters');
  console.log('Final prompt:', test.final_prompt);
  console.log('\nInputs:', JSON.stringify(test.inputs, null, 2));
  console.log('\nImage URL:', test.image_url);
  console.log('\nSource image URL:', test.source_image_url);
}

checkTest1Detail().catch(console.error);
