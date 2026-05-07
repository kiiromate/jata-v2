-- Keep auth users, public.users, and profiles synchronized.
-- Applications currently reference public.users(id), so new authenticated users
-- must have a matching public.users row before captures/applications can insert.

INSERT INTO public.users (
  id,
  email,
  name,
  full_name,
  avatar_url,
  created_at,
  updated_at
)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email, 'JATA user'),
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  au.raw_user_meta_data->>'avatar_url',
  COALESCE(au.created_at, timezone('utc'::text, now())),
  timezone('utc'::text, now())
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1
  FROM public.users pu
  WHERE pu.id = au.id
);

INSERT INTO public.profiles (
  id,
  full_name,
  avatar_url,
  updated_at
)
SELECT
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  au.raw_user_meta_data->>'avatar_url',
  timezone('utc'::text, now())
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1
  FROM public.profiles pp
  WHERE pp.id = au.id
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    name,
    full_name,
    avatar_url,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email, 'JATA user'),
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.created_at, timezone('utc'::text, now())),
    timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = COALESCE(public.users.name, EXCLUDED.name),
    full_name = COALESCE(public.users.full_name, EXCLUDED.full_name),
    avatar_url = COALESCE(public.users.avatar_url, EXCLUDED.avatar_url),
    updated_at = timezone('utc'::text, now());

  INSERT INTO public.profiles (
    id,
    full_name,
    avatar_url,
    updated_at
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url',
    timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
    updated_at = timezone('utc'::text, now());

  RETURN new;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
