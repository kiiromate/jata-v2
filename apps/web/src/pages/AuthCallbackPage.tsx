import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const AUTH_CALLBACK_TIMEOUT_MS = 10000;

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

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;

    const finishWithRedirect = (nextMessage: string, path: string, delayMs: number) => {
      if (!isMounted) {
        return;
      }

      setStatus('success');
      setMessage(nextMessage);
      redirectTimer = setTimeout(() => navigate(path, { replace: true }), delayMs);
    };

    const handleAuthCallback = async () => {
      try {
        const hash = window.location.hash;
        const hashParams = new URLSearchParams(hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        
        const accessToken = hashParams.get('access_token') || queryParams.get('access_token') || searchParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token') || searchParams.get('refresh_token');
        const tokenType = hashParams.get('token_type') || queryParams.get('token_type') || searchParams.get('token_type');
        const code = queryParams.get('code') || searchParams.get('code');
        const type = hashParams.get('type') || queryParams.get('type') || searchParams.get('type');
        const authError = hashParams.get('error_description') || queryParams.get('error_description') || hashParams.get('error') || queryParams.get('error');

        if (authError) {
          setStatus('error');
          setMessage('This authentication link could not be verified. Please request a new link.');
          return;
        }

        const redirectPath = type === 'recovery' ? '/update-password' : '/dashboard';
        const redirectMessage = type === 'recovery'
          ? 'Redirecting to update password...'
          : 'Authentication successful. Redirecting...';

        if (code) {
          const { error } = await withTimeout(
            supabase.auth.exchangeCodeForSession(code),
            AUTH_CALLBACK_TIMEOUT_MS,
            'Authentication link verification timed out.',
          );
          
          if (error) {
            console.error('Error exchanging auth code:', error.message);
            setStatus('error');
            setMessage('This authentication link could not be verified. Please request a new link.');
            return;
          }

          finishWithRedirect(redirectMessage, redirectPath, 500);
          return;
        }

        if (accessToken && refreshToken && tokenType) {
          const { error } = await withTimeout(
            supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            }),
            AUTH_CALLBACK_TIMEOUT_MS,
            'Authentication session setup timed out.',
          );
          
          if (error) {
            console.error('Error setting session:', error.message);
            setStatus('error');
            setMessage('This authentication link could not be verified. Please request a new link.');
            return;
          }

          finishWithRedirect(redirectMessage, redirectPath, 500);
          return;
        }

        const { data: { session }, error } = await withTimeout(
          supabase.auth.getSession(),
          AUTH_CALLBACK_TIMEOUT_MS,
          'Authentication session check timed out.',
        );

        if (error) {
          console.error('Error getting session:', error.message);
          setStatus('error');
          setMessage('Authentication failed. Please sign in again.');
          return;
        }

        if (session) {
          finishWithRedirect(redirectMessage, redirectPath, 500);
          return;
        }

        setStatus('error');
        setMessage('Invalid or expired authentication link. Please sign in again.');
      } catch (err) {
        console.error('Unexpected error in auth callback:', err);
        setStatus('error');
        setMessage(err instanceof Error && err.message.includes('timed out')
          ? 'Authentication is taking too long. Please sign in again.'
          : 'An unexpected error occurred. Please try again.');
      }
    };

    handleAuthCallback();

    return () => {
      isMounted = false;
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Verifying...</h2>
            <p className="text-gray-600">Please wait while we verify your authentication.</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-green-800 mb-2">Success!</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-800 mb-2">Authentication Failed</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <button 
              onClick={() => navigate('/signin')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Go to Sign In
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallbackPage;
