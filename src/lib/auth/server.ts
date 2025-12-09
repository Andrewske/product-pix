import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

export const requireAuth = async (): Promise<User> => {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(`Authentication required: ${error.message}`);
  }
  if (!user) {
    throw new Error('Authentication required: no user session found');
  }

  return user;
};

export { withAuth, type AuthenticatedRequest, type AuthenticatedHandler } from './api-middleware';
