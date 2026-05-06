ALTER TABLE public.ai_outputs
DROP CONSTRAINT IF EXISTS ai_outputs_provider_check;

ALTER TABLE public.ai_outputs
ADD CONSTRAINT ai_outputs_provider_check
CHECK (provider IN ('none', 'mock', 'huggingface', 'openrouter'));
