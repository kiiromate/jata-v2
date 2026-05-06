-- Capture Inbox v1 uses public.applications as canonical opportunity storage.
-- Nullable metadata keeps existing application tracking, scoring, and pack flows compatible.

ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS job_description TEXT,
ADD COLUMN IF NOT EXISTS jata_score INTEGER,
ADD COLUMN IF NOT EXISTS final_resume_text TEXT,
ADD COLUMN IF NOT EXISTS selected_resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS capture_source TEXT,
ADD COLUMN IF NOT EXISTS capture_method TEXT,
ADD COLUMN IF NOT EXISTS capture_status TEXT,
ADD COLUMN IF NOT EXISTS parse_status TEXT,
ADD COLUMN IF NOT EXISTS score_status TEXT,
ADD COLUMN IF NOT EXISTS duplicate_status TEXT,
ADD COLUMN IF NOT EXISTS duplicate_of_application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS capture_raw_input JSONB NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS capture_parsed_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS capture_score_result JSONB,
ADD COLUMN IF NOT EXISTS capture_dedupe_result JSONB,
ADD COLUMN IF NOT EXISTS capture_action_log JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS promoted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pack_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS parsed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS scored_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'applications_capture_source_check'
  ) THEN
    ALTER TABLE public.applications
    ADD CONSTRAINT applications_capture_source_check
    CHECK (
      capture_source IS NULL OR
      capture_source IN ('web', 'browser_extension', 'mobile_share', 'telegram', 'manual', 'api')
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'applications_capture_method_check'
  ) THEN
    ALTER TABLE public.applications
    ADD CONSTRAINT applications_capture_method_check
    CHECK (
      capture_method IS NULL OR
      capture_method IN ('url', 'text', 'file', 'manual', 'share', 'message')
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'applications_capture_status_check'
  ) THEN
    ALTER TABLE public.applications
    ADD CONSTRAINT applications_capture_status_check
    CHECK (
      capture_status IS NULL OR
      capture_status IN ('inbox', 'processing', 'ready', 'shortlisted', 'pack_pending', 'archived')
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'applications_parse_status_check'
  ) THEN
    ALTER TABLE public.applications
    ADD CONSTRAINT applications_parse_status_check
    CHECK (
      parse_status IS NULL OR
      parse_status IN ('not_started', 'pending', 'completed', 'failed', 'not_required')
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'applications_score_status_check'
  ) THEN
    ALTER TABLE public.applications
    ADD CONSTRAINT applications_score_status_check
    CHECK (
      score_status IS NULL OR
      score_status IN ('not_started', 'pending', 'completed', 'failed', 'not_required')
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'applications_duplicate_status_check'
  ) THEN
    ALTER TABLE public.applications
    ADD CONSTRAINT applications_duplicate_status_check
    CHECK (
      duplicate_status IS NULL OR
      duplicate_status IN ('unknown', 'unique', 'possible_duplicate', 'duplicate')
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_applications_capture_inbox_user_status
ON public.applications(user_id, capture_status)
WHERE capture_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_applications_capture_source
ON public.applications(user_id, capture_source)
WHERE capture_source IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_applications_capture_duplicate
ON public.applications(user_id, duplicate_status)
WHERE duplicate_status IS NOT NULL;
