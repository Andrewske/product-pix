// src/lib/db/users.ts
import { createClient } from '@/lib/supabase/server';
import type { User, UserUpdate } from '@/types';

export const getCurrentUser = async (): Promise<User | null> => {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return data;
};

export const updateUser = async (
  userId: string,
  updates: UserUpdate
): Promise<User | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user:', error);
    return null;
  }

  return data;
};

export const getUserCredits = async (userId: string): Promise<number> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('users')
    .select('credit_balance')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching credits:', error);
    return 0;
  }

  return data?.credit_balance ?? 0;
};