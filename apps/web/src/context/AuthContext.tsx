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

/**
 * @interface AuthContextType
 * @description Defines the shape of the authentication context data.
 *
 * @property {Session | null} session - The current user session object, or null if not authenticated.
 * @property {User | null} user - The current user object, or null if not authenticated.
 * @property {boolean} loading - True when the authentication state is being initialized, false otherwise.
 */
interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

/**
 * The React context for authentication.
 *
 * @remarks
 * Initialized with a default value. Components will consume this context to get
 * the current authentication state.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * @interface AuthProviderProps
 * @description Defines the props for the AuthProvider component.
 *
 * @property {ReactNode} children - The child components that will have access to the context.
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * @component AuthProvider
 * @description A React component that provides the authentication context to its children.
 *
 * This provider handles the logic for fetching the user's session, updating the
 * state, and subscribing to auth changes from Supabase.
 *
 * @param {AuthProviderProps} props - The component props.
 * @returns {JSX.Element} The provider component.
 */
export const AuthProvider = ({ children }: AuthProviderProps): JSX.Element => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * Fetches the initial user session and sets up a listener for auth state changes.
     */
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error("Error fetching initial session:", error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Cleanup the listener on component unmount
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    loading,
  };

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
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
