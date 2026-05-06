import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { usePostHog } from 'posthog-js/react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { getAuthErrorMessage } from "../lib/authMessages";

const SigninPage = () => {
  const posthog = usePostHog();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('signIn'); // 'signIn' or 'signUp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(getAuthErrorMessage(error.message));
      } else {
        posthog.capture('user_signed_in');
        navigate('/dashboard');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError('');
    setMessage('');
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setError(getAuthErrorMessage(error.message));
      } else {
        setMessage('Success! Please check your email to confirm your sign up.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    setError('');
    setMessage('');
    const email = prompt("Please enter your email address to reset your password:");
    if (email) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Password reset link has been sent to your email.");
      }
    }
  };

  

  return (
    <div className="flex items-center justify-center min-h-screen bg-light-gray">
      <div className="relative w-full max-w-md p-8 space-y-6 bg-pure-white rounded-lg shadow-md">
        
        <div className="text-center pt-8">
          <h1 className="text-3xl font-bold text-jet-black">JATA</h1>
          <p className="text-charcoal-gray">Your AI-Powered Job Application Tracker</p>
        </div>

        <div className="flex border-b border-cool-gray">
          <button
            onClick={() => setActiveTab('signIn')}
            className={`flex-1 py-2 text-sm font-semibold text-center transition-colors duration-300 ${activeTab === 'signIn' ? 'text-jet-black border-b-2 border-soft-olive' : 'text-charcoal-gray'}`}>
            Sign In
          </button>
          <button
            onClick={() => setActiveTab('signUp')}
            className={`flex-1 py-2 text-sm font-semibold text-center transition-colors duration-300 ${activeTab === 'signUp' ? 'text-jet-black border-b-2 border-soft-olive' : 'text-charcoal-gray'}`}>
            Sign Up
          </button>
        </div>

        {error && (
          <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-center text-sm font-medium leading-relaxed text-red-700">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-center text-sm font-medium leading-relaxed text-green-700">
            {message}
          </p>
        )}

        {activeTab === 'signIn' ? (
          <form onSubmit={handleSignIn} className="space-y-6">
            <div>
              <label className="text-sm font-medium text-charcoal-gray">Email address</label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                </span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field pl-10" placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-charcoal-gray">Password</label>
                <button type="button" onClick={handlePasswordReset} className="text-xs text-soft-olive hover:underline">Forgot password?</button>
              </div>
              <div className="relative mt-1">
                 <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="w-5 h-5 text-gray-400" />
                </span>
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="input-field pl-10 pr-10" placeholder="••••••••" />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                </span>
              </div>
            </div>
            <button type="submit" className="btn disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting}>
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-6">
            <div>
              <label className="text-sm font-medium text-charcoal-gray">Email address</label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                </span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field pl-10" placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-charcoal-gray">Password</label>
               <div className="relative mt-1">
                 <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="w-5 h-5 text-gray-400" />
                </span>
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="input-field pl-10 pr-10" placeholder="••••••••" />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-charcoal-gray">Confirm Password</label>
              <div className="relative mt-1">
                 <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="w-5 h-5 text-gray-400" />
                </span>
                <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="input-field pl-10 pr-10" placeholder="••••••••" />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                </span>
              </div>
            </div>
            <button type="submit" className="btn disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting}>
              {isSubmitting ? 'Signing Up...' : 'Sign Up'}
            </button>
            <p className="text-xs text-center text-charcoal-gray mt-4">
              By signing up, you agree to our{' '}
              <a href="/privacy" className="text-soft-olive hover:underline">Privacy Policy</a>
            </p>
          </form>
        )}
      </div>

      
    </div>
  );
};

export default SigninPage;
