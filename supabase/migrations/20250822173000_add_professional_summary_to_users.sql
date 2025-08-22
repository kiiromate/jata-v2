-- Add professional_summary column to the users table

ALTER TABLE public.users
ADD COLUMN professional_summary text;