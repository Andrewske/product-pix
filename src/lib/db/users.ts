import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logging';
import type { User } from '@/types';

export async function getUserById(userId: string): Promise<User | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    logger.error('Error fetching user', {
      error: error.message,
      userId,
    });
    return null;
  }

  return data;
}