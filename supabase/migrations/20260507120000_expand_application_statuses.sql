ALTER TABLE public.applications
DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE public.applications
ALTER COLUMN status SET DEFAULT 'Saved';

ALTER TABLE public.applications
ADD CONSTRAINT applications_status_check
CHECK (
  status = ANY (
    ARRAY[
      'Saved'::text,
      'Applying'::text,
      'Applied'::text,
      'Interview'::text,
      'Offer'::text,
      'Rejected'::text
    ]
  )
);
