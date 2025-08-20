-- Add columns for user profile customization and Google Drive integration

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS drive_folder_id TEXT;

-- Ensure RLS is enabled on the users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies for users table
-- 1. Allow users to read their own profile data
DROP POLICY IF EXISTS "Users can view their own data." ON public.users;
CREATE POLICY "Users can view their own data." ON public.users
FOR SELECT USING (auth.uid() = id);

-- 2. Allow users to update their own profile data
DROP POLICY IF EXISTS "Users can update their own profile." ON public.users;
CREATE POLICY "Users can update their own profile." ON public.users
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Note: The 'full_name' column is usually sourced from the identity provider
-- and available in the auth.users table's raw_user_meta_data.
-- The frontend code attempts to read it, but we won't add it here
-- to avoid conflicts with Supabase's auth flow.
-- The frontend will gracefully handle it if it's null.
