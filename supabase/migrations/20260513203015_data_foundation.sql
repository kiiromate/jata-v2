-- Data Foundation: add extracted_text to resumes and enrich opportunity metadata on applications.
-- All new columns are nullable; no existing rows are altered; existing RLS policies extend automatically.

ALTER TABLE public.resumes
  ADD COLUMN IF NOT EXISTS extracted_text TEXT;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS company_about TEXT,
  ADD COLUMN IF NOT EXISTS work_mode TEXT CHECK (work_mode IN ('remote', 'hybrid', 'onsite', 'unknown')),
  ADD COLUMN IF NOT EXISTS salary_range TEXT,
  ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS job_type TEXT CHECK (job_type IN ('full_time', 'part_time', 'contract', 'internship', 'other')),
  ADD COLUMN IF NOT EXISTS location_detail TEXT;
