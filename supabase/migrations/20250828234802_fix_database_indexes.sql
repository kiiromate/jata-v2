CREATE INDEX idx_resumes_user_id ON public.resumes(user_id);

DROP INDEX IF EXISTS public.idx_scrape_configs_user_id;