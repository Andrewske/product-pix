'use client';

import { useEffect, useMemo, useState } from 'react';
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
  const [profileLoading, setProfileLoading] = useState(false);

  // Reset profile when user changes
  const currentProfile = useMemo(() => {
    if (!user) return null;
    return profile;
  }, [user, profile]);

  useEffect(() => {
    if (!user) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfileLoading(true);
    const supabase = createClient();

    supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching profile', {
            error: error.message,
            userId: user.id,
          });
        }
        setProfile(data);
        setProfileLoading(false);
      });
  }, [user]);

  return { user, profile: currentProfile, loading: authLoading || profileLoading };
}

export function useCredits(): UseCreditsResult {
  const { profile, loading } = useUserProfile();
  return {
    credits: profile?.credit_balance ?? 0,
    loading,
  };
}
