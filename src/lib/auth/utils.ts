import { createClient } from '@/lib/supabase/client';

interface AuthResult {
  error: string | null;
}

export const signOut = async (): Promise<void> => {
  const supabase = createClient();
  await supabase.auth.signOut();
};

export const resetPassword = async (email: string): Promise<AuthResult> => {
  const supabase = createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  return { error: error?.message ?? null };
};

export const updatePassword = async (newPassword: string): Promise<AuthResult> => {
  const supabase = createClient();

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  return { error: error?.message ?? null };
};
