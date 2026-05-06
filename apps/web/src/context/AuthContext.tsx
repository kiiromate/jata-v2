/**
 * @file AuthContext.tsx
 * @description Provides authentication context for the entire application.
 *
 * This file creates a React context that manages the user's authentication state,
 * including the session, user object, and loading status. It interacts with the
 * Supabase client to fetch the initial session and listen for real-time
 * authentication changes (e.g., sign-in, sign-out).
 *
 * The `AuthProvider` component should wrap the root of the application to make
 * the authentication state available to all child components. The `useAuth` hook
 * provides a convenient way to access this context.
 */

import { createContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import type { Database } from '@jata/common';

type Profile = Database['public']['Tables']['profiles']['Row'];

const PROFILE_FETCH_TIMEOUT_MS = 8000;

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const fetchProfile = async (userId: string, source: string): Promise<Profile | null> => {
  try {
    const { data, error } = await withTimeout(
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(),
      PROFILE_FETCH_TIMEOUT_MS,
      `Profile fetch timed out during ${source}`,
    );

    if (error && error.code !== 'PGRST116') {
      console.warn(`Error fetching profile during ${source}:`, error.message);
    }

    return data || null;
  } catch {
    console.warn(`Could not fetch profile during ${source}, continuing without it`);
    return null;
  }
};

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps): JSX.Element => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchSession = async () => {
      try {
        // Fetch initial session data
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          // If the refresh token is invalid, force a sign out to clear the stale session
          if (error.message.includes('Refresh Token') || error.message.includes('refresh_token_not_found')) {
             await supabase.auth.signOut();
          }
          throw error;
        }

        if (!isMounted) {
          return;
        }

        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setLoading(false);

        if (currentUser) {
          const profileData = await fetchProfile(currentUser.id, 'initial session');
          if (isMounted) {
            setProfile(profileData);
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Error in auth session fetch:', error);
        if (isMounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) {
          return;
        }

        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setLoading(false);

        if (!currentUser) {
          setProfile(null);
          return;
        }

        window.setTimeout(async () => {
          const profileData = await fetchProfile(currentUser.id, 'auth state change');
          if (isMounted) {
            setProfile(profileData);
          }
        }, 0);
      }
    );

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    profile,
    loading,
  };

  // Don't block rendering - let pages handle their own loading states
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
