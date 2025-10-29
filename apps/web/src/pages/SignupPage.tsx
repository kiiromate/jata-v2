import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

const SignupPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('signUp'); // Default to signUp
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
    } else {
      navigate('/dashboard');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      setError(error.message);
    } else {
      setMessage('Success! Please check your email to confirm your sign up.');
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

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        {message && <p className="text-green-500 text-sm text-center">{message}</p>}

        {activeTab === 'signIn' ? (
          <form onSubmit={handleSignIn} className="space-y-6">
            {/* Sign In Form Fields */}
            <div>
              <label className="text-sm font-medium text-charcoal-gray">Email address</label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><Mail className="w-5 h-5 text-gray-400" /></span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field pl-10" placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-charcoal-gray">Password</label>
                <button type="button" onClick={handlePasswordReset} className="text-xs text-soft-olive hover:underline">Forgot password?</button>
              </div>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><Lock className="w-5 h-5 text-gray-400" /></span>
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="input-field pl-10 pr-10" placeholder="••••••••" />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}</span>
              </div>
            </div>
            <button type="submit" className="btn">Sign In</button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-6">
            {/* Sign Up Form Fields */}
            <div>
              <label className="text-sm font-medium text-charcoal-gray">Email address</label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><Mail className="w-5 h-5 text-gray-400" /></span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field pl-10" placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-charcoal-gray">Password</label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><Lock className="w-5 h-5 text-gray-400" /></span>
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="input-field pl-10 pr-10" placeholder="••••••••" />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-charcoal-gray">Confirm Password</label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><Lock className="w-5 h-5 text-gray-400" /></span>
                <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="input-field pl-10 pr-10" placeholder="••••••••" />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}</span>
              </div>
            </div>
            <button type="submit" className="btn">Sign Up</button>
            <p className="text-xs text-center text-charcoal-gray mt-4">
              By signing up, you agree to our{' '}
              <a href="/terms" className="text-soft-olive hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" className="text-soft-olive hover:underline">Privacy Policy</a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default SignupPage;
