CREATE TABLE IF NOT EXISTS public.ai_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('mock', 'huggingface', 'openrouter')),
  model TEXT NOT NULL DEFAULT '',
  task_type TEXT NOT NULL CHECK (
    task_type IN (
      'analyzeCvMatch',
      'suggestResumeImprovements',
      'generateCoverLetter',
      'generateRecruiterMessage',
      'generateFollowUpMessage',
      'summarizeOpportunity'
    )
  ),
  input_hash TEXT NOT NULL,
  output_hash TEXT,
  prompt_char_count INTEGER NOT NULL DEFAULT 0 CHECK (prompt_char_count >= 0),
  response_char_count INTEGER NOT NULL DEFAULT 0 CHECK (response_char_count >= 0),
  latency_ms INTEGER NOT NULL DEFAULT 0 CHECK (latency_ms >= 0),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'blocked')),
  error_message TEXT,
  output_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ai_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own AI outputs"
ON public.ai_outputs
FOR SELECT
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own AI outputs"
ON public.ai_outputs
FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS ai_outputs_user_created_at_idx
ON public.ai_outputs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS ai_outputs_cache_idx
ON public.ai_outputs (user_id, task_type, input_hash, created_at DESC)
WHERE status = 'success';

CREATE INDEX IF NOT EXISTS ai_outputs_failures_idx
ON public.ai_outputs (user_id, created_at DESC)
WHERE status = 'failed';
