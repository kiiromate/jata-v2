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
        if (error) throw error;

        if (isMounted) {
          setSession(session);
          const currentUser = session?.user ?? null;
          setUser(currentUser);

          if (currentUser) {
            try {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentUser.id)
                .maybeSingle();

              if (profileError && profileError.code !== 'PGRST116') {
                // Only log if it's not a "no rows returned" error
                console.warn('Error fetching profile:', profileError.message);
              }
              setProfile(profileData || null);
            } catch (err) {
              console.warn('Could not fetch profile, continuing without it');
              setProfile(null);
            }
          } else {
            setProfile(null);
          }
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
      async (_event, session) => {
        if (isMounted) {
          setSession(session);
          const currentUser = session?.user ?? null;
          setUser(currentUser);

          if (currentUser) {
            try {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentUser.id)
                .maybeSingle();
              
              if (profileError && profileError.code !== 'PGRST116') {
                // Only log if it's not a "no rows returned" error
                console.warn('Error fetching profile on auth change:', profileError.message);
              }
              setProfile(profileData || null);
            } catch (err) {
              console.warn('Could not fetch profile on auth change, continuing without it');
              setProfile(null);
            }
          } else {
            setProfile(null);
          }
          // Ensure loading is false after the listener acts, especially for sign-in/out events
          setLoading(false); 
        }
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
