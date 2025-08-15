-- Adds columns to the applications table to store analysis results
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS job_description TEXT,
ADD COLUMN IF NOT EXISTS resume_content TEXT,
ADD COLUMN IF NOT EXISTS extracted_skills JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS missing_skills JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS tailored_resume_content TEXT,
ADD COLUMN IF NOT EXISTS cover_letter_content TEXT,
ADD COLUMN IF NOT EXISTS analysis_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tailoring_completed_at TIMESTAMPTZ;