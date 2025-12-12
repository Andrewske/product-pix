import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const requireAuth = async (): Promise<User> => {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  return user;
};

export { withAuth, type AuthenticatedRequest, type AuthenticatedHandler } from './api-middleware';
