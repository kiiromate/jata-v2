/**
 * @file ProtectedRoute.tsx
 * @description A component to protect routes that require authentication.
 *
 * This component checks the user's authentication status from the AuthContext.
 * If the session is still loading, it displays a loading indicator. If the user
 * is not authenticated, it redirects them to the login page. Otherwise, it
 * renders the child components, allowing access to the protected route.
 */

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * @interface ProtectedRouteProps
 * @description Defines the props for the ProtectedRoute component.
 *
 * @property {ReactNode} children - The components to render if the user is authenticated.
 */
interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * @component ProtectedRoute
 * @description A guard component that ensures a user is authenticated before
 * rendering its children.
 *
 * @param {ProtectedRouteProps} props - The component props.
 * @returns {JSX.Element | null} The child components, a redirect, or a loading spinner.
 */
const ProtectedRoute = ({ children }: ProtectedRouteProps): JSX.Element | null => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
