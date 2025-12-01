'use client';

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type { User as DbUser } from '@/types';

interface UseUserResult {
  user: User | null;
  loading: boolean;
}

interface UseUserProfileResult {
  user: User | null;
  profile: DbUser | null;
  loading: boolean;
}

interface UseCreditsResult {
  credits: number;
  loading: boolean;
}

export function useUser(): UseUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      setUser(authUser);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}

export function useUserProfile(): UseUserProfileResult {
  const { user, loading: authLoading } = useUser();
  const [profile, setProfile] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const supabase = createClient();

    supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching profile:', error);
        }
        setProfile(data);
        setLoading(false);
      });
  }, [user, authLoading]);

  return { user, profile, loading: authLoading || loading };
}

export function useCredits(): UseCreditsResult {
  const { profile, loading } = useUserProfile();
  return {
    credits: profile?.credit_balance ?? 0,
    loading,
  };
}
