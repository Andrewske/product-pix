'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging';

export async function restoreDeletedAccount(userId: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const supabase = await createClient();

    // Get current admin user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, message: 'Unauthorized' };
    }

    const adminClient = createAdminClient();

    // Call atomic RPC
    const { data, error } = await adminClient.rpc('restore_deleted_account', {
      p_user_id: userId,
      p_admin_id: user.id
    });

    if (error) {
      logger.error('Account restoration failed', { error, userId });
      return { success: false, message: error.message };
    }

    const result = data?.[0];
    if (!result) {
      return { success: false, message: 'Invalid response from database' };
    }

    if (result.success) {
      logger.info('Account restored successfully', { userId });
    }

    return {
      success: result.success,
      message: result.message
    };
  } catch (error) {
    logger.error('Error restoring account', { error, userId });
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}