/**
 * @file useAuth.ts
 * @description Custom hook to access authentication context.
 *
 * This hook provides a convenient way to access the authentication state
 * from the AuthContext. It ensures type safety and proper error handling
 * when used outside of an AuthProvider.
 */

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

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
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
