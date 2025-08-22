import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const Onboarding = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);

  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ has_completed_onboarding: true })
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: Error) => {
      alert(`Error completing onboarding: ${error.message}`);
    },
  });

  const handleNextStep = () => {
    setStep(prev => prev + 1);
  };

  const handleCompleteOnboarding = () => {
    completeOnboardingMutation.mutate();
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 lg:p-8 max-w-xs sm:max-w-lg lg:max-w-2xl mx-auto my-8 sm:my-16 text-center">
      {step === 1 && (
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">Welcome to JATA!</h1>
          <p className="text-sm sm:text-base text-gray-600 mb-6">Your ultimate companion for streamlining your job application process. Manage resumes, tailor applications, and track your progress with ease.</p>
          <button onClick={handleNextStep} className="w-full sm:w-auto px-6 py-3 text-base sm:text-lg font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
            Get Started
          </button>
        </div>
      )}
      {step === 2 && (
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Install the Browser Extension</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">Effortlessly scrape job descriptions from any website with our powerful browser extension. It's the fastest way to get started with JATA.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <a href="/install-extension" className="w-full sm:w-auto px-6 py-3 text-base sm:text-lg font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 text-center">
              Install Extension
            </a>
            <button onClick={handleNextStep} className="w-full sm:w-auto px-6 py-3 text-base sm:text-lg font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
              I'll do this later
            </button>
          </div>
        </div>
      )}
      {step === 3 && (
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Add Your First Application</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">You're all set! You can now start adding applications to your dashboard. Let's add your first one now.</p>
          <button onClick={handleCompleteOnboarding} className="w-full sm:w-auto px-6 py-3 text-base sm:text-lg font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
            Add First Application Manually
          </button>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
