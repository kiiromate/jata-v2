-- Create Storage Buckets
insert into storage.buckets (id, name, public)
values 
  ('resumes', 'resumes', false),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Set up RLS for Storage
-- Note: we use (storage.foldername(name))[1] to ensure users can only access their own folders (named by their UUID)

-- Resumes: Private management
create policy "Users can manage their own resumes"
on storage.objects for all
to authenticated
using ( bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text )
with check ( bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text );

-- Avatars: Public read, Private management
create policy "Public can view avatars"
on storage.objects for select
to public
using ( bucket_id = 'avatars' );

create policy "Users can manage their own avatars"
on storage.objects for all
to authenticated
using ( bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text )
with check ( bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text );
