import React, { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { getAuthErrorMessage } from "../lib/authMessages";
import { cn } from "@/lib/utils";

type AuthTab = 'signIn' | 'signUp';

const SignupPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AuthTab>('signUp');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const switchTab = (tab: AuthTab) => {
    setActiveTab(tab);
    setError('');
    setMessage('');
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');
    setMessage('');
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(getAuthErrorMessage(error.message));
      } else {
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
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setError(getAuthErrorMessage(error.message));
      } else {
        setMessage('Check your email to confirm your account.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    setError('');
    setMessage('');
    const resetEmail = prompt("Enter your email to receive a reset link:");
    if (resetEmail) {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) setError(error.message);
      else setMessage("Reset link sent — check your inbox.");
    }
  };

  return (
    <div className="min-h-screen bg-jata-deep-carbon flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Wordmark */}
        <div className="mb-8 text-center">
          <span className="font-mono text-xl font-medium tracking-[0.25em] text-jata-text-primary uppercase select-none">
            jata
          </span>
          <p className="mt-1.5 font-mono text-[10px] tracking-widest text-jata-text-muted uppercase">
            Job Application Tracker
          </p>
        </div>

        {/* Card */}
        <div className="bg-jata-iron-charcoal border border-jata-graphite-mist rounded-lg overflow-hidden">
          {/* Tab rail */}
          <div className="flex border-b border-jata-graphite-mist">
            {(['signIn', 'signUp'] as AuthTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => switchTab(tab)}
                className={cn(
                  "flex-1 py-3 font-mono text-[10px] tracking-widest uppercase transition-colors",
                  activeTab === tab
                    ? "text-jata-accent-lime border-b-2 border-jata-accent-lime -mb-px"
                    : "text-jata-text-muted hover:text-jata-text-secondary"
                )}
              >
                {tab === 'signIn' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Form area */}
          <div className="p-6 space-y-4">
            {error && (
              <p role="alert" className="font-mono text-[10px] text-jata-status-rejected border border-jata-status-rejected/20 bg-jata-status-rejected/5 rounded px-3 py-2">
                {error}
              </p>
            )}
            {message && (
              <p className="font-mono text-[10px] text-jata-accent-lime border border-jata-accent-lime/20 bg-jata-accent-lime/5 rounded px-3 py-2">
                {message}
              </p>
            )}

            {activeTab === 'signIn' ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <AuthField label="Email">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-jata-text-muted pointer-events-none">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="input-field pl-9"
                    />
                  </div>
                </AuthField>

                <AuthField
                  label="Password"
                  action={
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      className="font-mono text-[10px] text-jata-text-muted hover:text-jata-accent-lime transition-colors"
                    >
                      Forgot?
                    </button>
                  }
                >
                  <PasswordInput
                    value={password}
                    onChange={setPassword}
                    show={showPassword}
                    onToggle={() => setShowPassword(!showPassword)}
                  />
                </AuthField>

                <AuthSubmit loading={isSubmitting} label="Sign In" />
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4">
                <AuthField label="Email">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-jata-text-muted pointer-events-none">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="input-field pl-9"
                    />
                  </div>
                </AuthField>

                <AuthField label="Password">
                  <PasswordInput
                    value={password}
                    onChange={setPassword}
                    show={showPassword}
                    onToggle={() => setShowPassword(!showPassword)}
                  />
                </AuthField>

                <AuthField label="Confirm Password">
                  <PasswordInput
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    show={showPassword}
                    onToggle={() => setShowPassword(!showPassword)}
                    placeholder="Repeat password"
                  />
                </AuthField>

                <AuthSubmit loading={isSubmitting} label="Create Account" />

                <p className="font-mono text-[10px] text-center text-jata-text-muted leading-relaxed">
                  By signing up you agree to our{' '}
                  <a href="/terms" className="text-jata-text-secondary hover:text-jata-accent-lime transition-colors">
                    Terms
                  </a>
                  {' '}&amp;{' '}
                  <a href="/privacy" className="text-jata-text-secondary hover:text-jata-accent-lime transition-colors">
                    Privacy Policy
                  </a>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function AuthField({
  label,
  action,
  children,
}: {
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-[10px] uppercase tracking-widest text-jata-text-muted">
          {label}
        </span>
        {action}
      </div>
      {children}
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  show,
  onToggle,
  placeholder = '••••••••',
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-jata-text-muted pointer-events-none">
        <Lock className="w-4 h-4" />
      </span>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        placeholder={placeholder}
        className="input-field pl-9 pr-9"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute inset-y-0 right-0 flex items-center pr-3 text-jata-text-muted hover:text-jata-text-secondary transition-colors"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

function AuthSubmit({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button type="submit" disabled={loading} className="btn mt-2">
      {loading ? 'Please wait...' : label}
    </button>
  );
}

export default SignupPage;
