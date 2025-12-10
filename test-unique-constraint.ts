import { createClient } from '@/lib/supabase/server';

async function testUniqueConstraint() {
  const supabase = await createClient();

  // Get a test user ID (you'll need to replace this with an actual user ID)
  const { data: users } = await supabase.from('users').select('id').limit(1);
  if (!users || users.length === 0) {
    console.log('No users found in database');
    return;
  }

  const userId = users[0].id;
  console.log(`Testing with user ID: ${userId}`);

  // Try to insert two records with the same title for the same user
  const testTitle = 'Test Unique Title ' + Date.now();

  try {
    // First insert should succeed
    const { error: error1 } = await supabase
      .from('generated_images')
      .insert({
        user_id: userId,
        title: testTitle,
        file_key: 'test1.jpg',
        public_url: 'https://example.com/test1.jpg',
        job_id: 'test-job-1',
        is_favorite: false,
      });

    if (error1) {
      console.log('First insert failed:', error1.message);
      return;
    }

    console.log('First insert succeeded');

    // Second insert with same title should fail due to unique constraint
    const { error: error2 } = await supabase
      .from('generated_images')
      .insert({
        user_id: userId,
        title: testTitle,
        file_key: 'test2.jpg',
        public_url: 'https://example.com/test2.jpg',
        job_id: 'test-job-2',
        is_favorite: false,
      });

    if (error2) {
      console.log('Second insert failed as expected (unique constraint):', error2.message);
    } else {
      console.log('ERROR: Second insert succeeded when it should have failed!');
    }

    // Clean up - delete the test record
    await supabase
      .from('generated_images')
      .delete()
      .eq('title', testTitle);

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testUniqueConstraint();