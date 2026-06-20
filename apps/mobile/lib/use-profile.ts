import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { UserRole } from '@moons/shared';
import { authFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  getCompanyLogoUrl,
  getProfileImageUrl,
} from '@/lib/profile-image';
import { mergeProfileIntoUser } from '@/lib/profile-sync';
import type { Profile } from '@/lib/types';

export function useProfile(options?: { syncUser?: boolean }) {
  const { user, updateUser } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const syncUser = options?.syncUser ?? true;

  const refresh = useCallback(async () => {
    try {
      const data = await authFetch<Profile>('/profiles/me');
      setProfile(data);
      if (syncUser && userRef.current) {
        await updateUser(mergeProfileIntoUser(userRef.current, data));
      }
      return data;
    } catch {
      setProfile(null);
      return null;
    }
  }, [syncUser, updateUser]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      refresh().finally(() => {
        if (active) setLoading(false);
      });
      return () => {
        active = false;
      };
    }, [refresh]),
  );

  const name = profile?.fullName ?? user?.fullName ?? user?.email ?? '';
  const avatarUrl = useMemo(
    () => getProfileImageUrl(user, profile, 'avatar'),
    [user, profile],
  );
  const logoUrl = useMemo(
    () => (user?.role === UserRole.RECRUITER ? getCompanyLogoUrl(profile) : null),
    [user?.role, profile],
  );

  return { profile, loading, refresh, name, avatarUrl, logoUrl, user };
}
