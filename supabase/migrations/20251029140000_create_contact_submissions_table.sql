-- Create contact_submissions table for contact form submissions
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 100),
  email TEXT NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  subject TEXT NOT NULL CHECK (char_length(subject) >= 2 AND char_length(subject) <= 200),
  message TEXT NOT NULL CHECK (char_length(message) >= 20 AND char_length(message) <= 2000),
  category TEXT NOT NULL CHECK (category IN ('support', 'sales', 'partnership', 'other')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance on status
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON public.contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON public.contact_submissions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can insert contact submissions (public form)
CREATE POLICY "Anyone can submit contact form"
  ON public.contact_submissions
  FOR INSERT
  WITH CHECK (true);

-- RLS Policy: Only authenticated admins can view submissions (optional - for future admin panel)
-- For now, we'll allow users to view their own submissions by email
CREATE POLICY "Users can view own submissions"
  ON public.contact_submissions
  FOR SELECT
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Add comment to table
COMMENT ON TABLE public.contact_submissions IS 'Stores contact form submissions from users and visitors';
