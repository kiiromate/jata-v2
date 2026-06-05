ALTER TABLE public.ai_outputs
DROP CONSTRAINT IF EXISTS ai_outputs_task_type_check;

ALTER TABLE public.ai_outputs
ADD CONSTRAINT ai_outputs_task_type_check
CHECK (
  task_type IN (
    'analyzeCvMatch',
    'suggestResumeImprovements',
    'generateCoverLetter',
    'generateRecruiterMessage',
    'generateFollowUpMessage',
    'summarizeOpportunity',
    'generateTailoredResume'
  )
);
