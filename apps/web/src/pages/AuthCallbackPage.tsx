import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the URL hash and search parameters
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1) || window.location.search);
        
        // Get the access token from either hash or query params
        const accessToken = params.get('access_token') || searchParams.get('access_token');
        const refreshToken = params.get('refresh_token') || searchParams.get('refresh_token');
        const tokenType = params.get('token_type') || searchParams.get('token_type');
        const type = params.get('type') || searchParams.get('type');
        
        console.log('Auth callback params:', { accessToken, refreshToken, tokenType, type });
        
        if (accessToken && refreshToken && tokenType) {
          // Set the session with the tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (error) {
            console.error('Error setting session:', error);
            setStatus('error');
            setMessage(error.message || 'Failed to set session');
            return;
          }
          
          console.log('Session set successfully:', data);
          
          if (type === 'signup' || type === 'email_change' || type === 'email_confirmation') {
            // Email verification successful
            setStatus('success');
            setMessage('Email verified successfully! Redirecting to dashboard...');
            
            // Redirect to dashboard after a brief delay
            setTimeout(() => {
              navigate('/dashboard');
            }, 2000);
          } else if (type === 'recovery') {
            // Password reset flow
            setStatus('success');
            setMessage('Redirecting to update password...');
            
            setTimeout(() => {
              navigate('/update-password');
            }, 1000);
          } else {
            // General auth success
            setStatus('success');
            setMessage('Authentication successful! Redirecting...');
            
            setTimeout(() => {
              navigate('/dashboard');
            }, 1500);
          }
        } else {
          // Check if we already have a session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error getting session:', error);
            setStatus('error');
            setMessage(error.message || 'Authentication failed');
            return;
          }
          
          if (session) {
            // We already have a valid session
            setStatus('success');
            setMessage('Authentication successful! Redirecting...');
            
            setTimeout(() => {
              navigate('/dashboard');
            }, 1500);
          } else {
            // No valid auth data found
            setStatus('error');
            setMessage('Invalid authentication link. Please try again.');
          }
        }
      } catch (err) {
        console.error('Unexpected error in auth callback:', err);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      }
    };

    handleAuthCallback();
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
