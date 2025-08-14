CREATE TABLE public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resume_name TEXT NOT NULL,
  resume_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own resumes"
ON public.resumes
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);