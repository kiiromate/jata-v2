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

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import type { Database } from '@jata/common';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', currentUser.id)
              .single();

            if (profileError) {
              console.error('Error fetching profile:', profileError);
              setProfile(null);
            } else {
              setProfile(profileData);
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
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', currentUser.id)
              .single();
            
            if (profileError) {
              console.error('Error fetching profile on auth change:', profileError);
              setProfile(null);
            } else {
              setProfile(profileData);
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

  if (loading) {
    return <div>Loading...</div>; // Or a more sophisticated loading spinner
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * @hook useAuth
 * @description A custom hook to easily consume the authentication context.
 *
 * This hook abstracts the `useContext` call and provides a clear, typed way to
 * access the authentication state. It also ensures that the hook is used within
 * an `AuthProvider` tree.
 *
 * @returns {AuthContextType} The authentication context value.
 * @throws {Error} If used outside of an `AuthProvider`.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
