# Supabase Free Setup Audit

Date: 2026-05-02
Scope: Setup checklist only. Do not apply migrations from this audit branch.

## Current Backend Shape

The app uses Supabase for:

- Auth: email/password, email confirmation, password reset, optional Google OAuth for Drive.
- Database: applications, resumes, profiles/users, feedback, contact submissions, analytics RPCs, AI output logs.
- Storage: resume files and avatar files.
- Edge Functions: AI generation, URL scraping, resume upload/create, application CRUD, account deletion.

## Required Tables And Buckets

Required tables for first launch:

- `public.applications`
- `public.resumes`
- `public.profiles`
- `public.users`, only if profile/settings code remains pointed there
- `public.feedback`
- `public.contact_submissions`
- `public.ai_outputs`

Required or expected later tables:

- `public.scrape_configs`
- `public.ai_credits`
- `public.ai_credit_transactions`

The AI credit tables are optional for MVP because `createSupabaseCreditsStore()` no-ops when they are missing.

Required storage buckets:

- `resumes`, used by `upload-resume`
- `avatars`, used by `AvatarUpload` and `delete-user`

## Migration Order

Apply migrations in timestamp order after reviewing destructive steps:

1. `20250808011430_initial_schema.sql`
2. `20250808233200_add_job_description_to_applications.sql`
3. `20250809000954_add_new_application_fields.sql`
4. `20250814182443_create_resumes_table.sql`
5. `20250814222121_enhance_applications_table_for_analysis.sql`
6. `20250814231358_create_user_analytics_rpc.sql`
7. `20250814231546_create_user_analytics_rpc.sql`
8. `20250814234358_upgrade_user_analytics_rpc_with_source.sql`
9. `20250820180000_create_public_users_table.sql`
10. `20250820181000_add_avatar_to_users.sql`
11. `20250820214700_add_user_profile_fields.sql`
12. `20250822121100_create_profiles_table.sql`
13. `20250822153401_restore_user_analytics_rpc.sql`
14. `20250822160803_add_profile_columns_to_users.sql`
15. `20250822162358_upgrade_analytics_rpc_v2.sql`
16. `20250822173000_add_professional_summary_to_users.sql`
17. `20250822173001_add_30_day_activity_to_analytics_rpc.sql`
18. `20250822180954_create_recent_activity_rpc.sql`
19. `20250828234802_fix_database_indexes.sql`
20. `20250829060009_create_get_user_analytics_v2_function.sql`, currently empty
21. `20250829080100_create_get_user_analytics_v2_function.sql`
22. `20250829085429_remote_schema.sql`, destructive schema reset style migration
23. `20251029120000_create_advanced_analytics_functions.sql`
24. `20251029130000_create_feedback_table.sql`
25. `20251029140000_create_contact_submissions_table.sql`
26. `20260501010000_create_ai_outputs_table.sql`

Review warning:

- `20250829085429_remote_schema.sql` drops many columns and replaces application/resume shapes. It must not be pushed blindly until the frontend is aligned.
- `get_user_analytics_v2` is created with an argument, then dropped by the remote schema migration. The frontend currently calls it without arguments.
- `packages/common/src/database.types.ts` is empty and should not be trusted as the source of truth.

## Required RLS Policies

Minimum RLS needed:

- `applications`: authenticated users can select, insert, update, and delete rows where `user_id = auth.uid()`.
- `resumes`: authenticated users can select, insert, update, and delete rows where `user_id = auth.uid()`.
- `profiles`: authenticated users can select and update their own profile where `id = auth.uid()`.
- `users`: if still used by profile/settings, authenticated users can select and update their own row where `id = auth.uid()`.
- `feedback`: authenticated users can insert and view their own feedback.
- `contact_submissions`: public insert is allowed, select should be restricted.
- `ai_outputs`: authenticated users can insert and read only their own AI output records.
- Buckets: users can read/write/delete only their own paths.

Known gap:

- The remote schema migration recreates `applications` insert/select policies but does not clearly restore update/delete policies for application rows.

## Auth Settings Needed

For Supabase Free first launch:

- Enable email/password auth.
- Keep email confirmations enabled only if production email templates and redirect URLs are ready.
- Set Site URL to the final preview or production URL when testing auth callbacks.
- Add redirect URLs for:
  - `http://localhost:5173`
  - `http://localhost:4173`
  - Vercel preview URL
  - Production domain when available
- Add `/auth/callback`, `/auth/confirm`, and `/update-password` redirect variants as needed by Supabase Auth.
- Enable Google provider only if Drive integration is part of the launch scope.

## Required Edge Functions

Required for first launch if the corresponding UI stays enabled:

- `ai-generate`
- `scrape-url`
- `upload-resume`
- `resumes-create`
- `delete-user`

Optional or currently not used directly by the web app:

- `applications-create`
- `applications-read`
- `applications-update`
- `applications-delete`
- `save-application-analysis`

Known function issues status:

- Fixed in `fix/p0-launch-core-flow`: `_shared/db.ts` keeps Supabase UUID user IDs as strings.
- Fixed in `fix/p0-launch-core-flow`: `ResumeTailorPage` reads `scrape-url` responses as `{ content }`.
- Fixed in `fix/p0-launch-core-flow`: `ProfilePage` and `ResumeTailorPage` no longer hardcode `http://localhost:54321/functions/v1/...`.
- Fixed in `fix/p0-launch-core-flow`: `resumes-create`, `upload-resume`, and web resume usage align on `filename` and `content`.
- Still required before production reliance: deploy the affected Edge Functions and test them against a disposable Supabase project.

## Required Local Env Vars

Root `.env.example` currently includes:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SENTRY_DSN=
VITE_PUBLIC_POSTHOG_KEY=
VITE_PUBLIC_POSTHOG_HOST=
JATA_AI_PROVIDER=mock
JATA_AI_MODEL_DEFAULT=cheap-model-name-here
OPENROUTER_API_KEY=
HUGGINGFACE_API_KEY=
JATA_AI_DAILY_LIMIT=20
JATA_AI_MONTHLY_LIMIT=300
JATA_AI_MAX_JD_CHARS=12000
JATA_AI_MAX_CV_CHARS=12000
```

Do not add real values to `.env.example`.

## Required Hosting Env Vars

For Vercel or Cloudflare Pages web preview:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SENTRY_DSN=
VITE_PUBLIC_POSTHOG_KEY=
VITE_PUBLIC_POSTHOG_HOST=
```

Optional Sentry build variable:

```env
SENTRY_AUTH_TOKEN=
```

This is only needed for release/source-map upload. It is not required for first preview.

For Supabase Edge Functions:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JATA_AI_PROVIDER=mock
JATA_AI_MODEL_DEFAULT=cheap-model-name-here
OPENROUTER_API_KEY=
HUGGINGFACE_API_KEY=
JATA_AI_DAILY_LIMIT=20
JATA_AI_MONTHLY_LIMIT=300
JATA_AI_MAX_JD_CHARS=12000
JATA_AI_MAX_CV_CHARS=12000
```

Use provider keys only in Supabase secrets, not in frontend hosting env unless the variable is intentionally public and starts with `VITE_`.

## Frontend/Migration Mismatches

P0 mismatch status:

- Fixed in `fix/p0-launch-core-flow`: application create/list/dashboard uses `title`, `company`, `url`, `date_applied`, `source`, `industry`, and Title Case statuses.
- Fixed in `fix/p0-launch-core-flow`: resume UI/functions use `filename` and `content`.
- Fixed in `fix/p0-launch-core-flow`: web Supabase client imports the shared `@jata/common` database type source.
- Made launch-safe in `fix/p0-launch-core-flow`: analytics navigation is hidden and direct `/analytics` shows an unavailable state until the RPC contract is repaired.
- Remaining P1: repair analytics RPCs and chart shapes, then re-enable analytics navigation.

## Safe Human Commands For Later

Run these only after the P0 code/schema contract is fixed and reviewed:

```powershell
git status --short --branch
pnpm install --frozen-lockfile
pnpm --filter @jata/web build
pnpm --filter @jata/extension build
```

Supabase project link and inspection:

```powershell
pnpm exec supabase login
pnpm exec supabase link --project-ref <project-ref>
pnpm exec supabase migration list --linked
```

Apply migrations only after reviewing the destructive migration and schema contract:

```powershell
pnpm exec supabase db push
```

Deploy Edge Functions only after fixing the UUID and response-shape issues:

```powershell
pnpm exec supabase functions deploy ai-generate
pnpm exec supabase functions deploy scrape-url
pnpm exec supabase functions deploy upload-resume
pnpm exec supabase functions deploy resumes-create
pnpm exec supabase functions deploy delete-user
```

Set non-secret AI defaults:

```powershell
pnpm exec supabase secrets set JATA_AI_PROVIDER=mock JATA_AI_MODEL_DEFAULT=mock-local JATA_AI_DAILY_LIMIT=20 JATA_AI_MONTHLY_LIMIT=300 JATA_AI_MAX_JD_CHARS=12000 JATA_AI_MAX_CV_CHARS=12000
```

Set provider keys only from a private shell or dashboard secret UI:

```powershell
pnpm exec supabase secrets set OPENROUTER_API_KEY=<redacted> HUGGINGFACE_API_KEY=<redacted>
```

Do not paste real secrets into logs, docs, commits, or chat.
