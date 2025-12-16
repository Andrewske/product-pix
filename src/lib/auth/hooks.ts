'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
  const identifiedRef = useRef(false);

  // Reset profile when user changes
  const currentProfile = useMemo(() => {
    if (!user) return null;
    return profile;
  }, [user, profile]);

  useEffect(() => {
    if (!user) {
      return;
    }

    setProfileLoading(true);
    const supabase = createClient();

    supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          import('@/lib/logging').then(({ logger }) => {
            logger.error('Error fetching profile', {
              error: error.message,
              userId: user.id,
            });
          });
        }
        setProfile(data);
        setProfileLoading(false);
      });
  }, [user]);

  useEffect(() => {
    if (!profile) {
      import('@/lib/analytics/client').then(({ resetUser }) => {
        resetUser();
      });
      identifiedRef.current = false;
    } else if (!identifiedRef.current) {
      import('@/lib/analytics/client').then(({ identifyUser }) => {
        identifyUser(profile.id, {
          email: profile.email,
          tier: profile.tier,
          created_at: profile.created_at,
        });
      });
      identifiedRef.current = true;
    }
  }, [profile]);

  return { user, profile: currentProfile, loading: authLoading || profileLoading };
}

export function useCredits(): UseCreditsResult {
  const { profile, loading } = useUserProfile();
  return {
    credits: profile?.credit_balance ?? 0,
    loading,
  };
}
