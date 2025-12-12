import { createClient } from '@/lib/supabase/server';

/**
 * Verify if a user has admin privileges
 * @param userId - The user ID to check
 * @returns Promise<boolean> - True if user is admin, false otherwise
 */
export async function requireAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: userProfile, error } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', userId)
    .single();

  return !error && userProfile?.is_admin === true;
}

/**
 * Get admin status with detailed error information
 * @param userId - The user ID to check
 * @returns Promise with success flag and optional error
 */
export async function getAdminStatus(
  userId: string
): Promise<{ isAdmin: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: userProfile, error } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', userId)
    .single();

  if (error) {
    return { isAdmin: false, error: error.message };
  }

  return { isAdmin: userProfile?.is_admin === true };
}