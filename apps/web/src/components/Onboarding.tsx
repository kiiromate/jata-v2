import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { useDashboardStore } from '../store/dashboardStore';
import { useToast } from '../components/ui/use-toast';

const Onboarding = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { openModal } = useDashboardStore();
  const { toast } = useToast();
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
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleNextStep = () => {
    setStep(prev => prev + 1);
  };

  const handleCompleteOnboarding = () => {
    completeOnboardingMutation.mutate();
    openModal();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 max-w-xs sm:max-w-lg lg:max-w-2xl mx-auto my-8 sm:my-16 text-center">
      {step === 1 && (
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-4">Welcome to JATA</h1>
          <p className="text-sm sm:text-base text-gray-600 mb-6 leading-relaxed">
            A tool for tracking job applications, tailoring resumes, and analyzing your search.
          </p>
          <button onClick={handleNextStep} className="w-full sm:w-auto px-6 py-3 text-base sm:text-lg font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors">
            Continue
          </button>
        </div>
      )}
      {step === 2 && (
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">Browser Extension</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6 leading-relaxed">
            Install the extension to capture job details directly from LinkedIn, Indeed, and other job boards.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <a href="/install-extension" className="w-full sm:w-auto px-6 py-3 text-base sm:text-lg font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 text-center transition-colors">
              Install Extension
            </a>
            <button onClick={handleNextStep} className="w-full sm:w-auto px-6 py-3 text-base sm:text-lg font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
              Skip for now
            </button>
          </div>
        </div>
      )}
      {step === 3 && (
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">Add Your First Application</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6 leading-relaxed">
            Ready to start tracking. Add your first application to your dashboard.
          </p>
          <button onClick={handleCompleteOnboarding} className="w-full sm:w-auto px-6 py-3 text-base sm:text-lg font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors">
            Add Application
          </button>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
