# Supabase Contract

Date: 2026-05-04
Branch: `fix/supabase-free-launch-wiring`

## Purpose
This document explicitly defines the Supabase schema, RLS policies, and Storage Buckets required by the JATA v2 frontend as of the `fix/supabase-free-launch-wiring` branch. It acts as the source of truth for exactly what the database must contain before launch. No migrations should be pushed until they match this contract.

## Tables & Columns

### 1. `applications`
Stores job applications manually created by the user or synced via the extension.

- `id` (uuid, primary key)
- `user_id` (uuid, foreign key to auth.users)
- `title` (text, not null)
- `company` (text, not null)
- `status` (text, ApplicationStatus: 'Applied' | 'Interview' | 'Offer' | 'Rejected', default 'Applied')
- `date_applied` (date or timestamp with time zone)
- `url` (text, nullable)
- `source` (text, nullable)
- `industry` (text, nullable)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)

### 2. `resumes`
Stores resume records and their parsed/raw text content.

- `id` (uuid, primary key)
- `user_id` (uuid, foreign key to auth.users)
- `filename` (text, not null)
- `content` (text, not null)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone, nullable)

### 3. `profiles`
Extended user profile data.

- `id` (uuid, primary key, references auth.users.id)
- `user_id` (uuid, nullable)
- `full_name` (text, nullable)
- `email` (text, nullable)
- `avatar_url` (text, nullable)
- `professional_summary` (text, nullable)
- `skills` (text[], nullable)
- `experience_level` (text, nullable)
- `industry` (text, nullable)
- `location` (text, nullable)
- `linkedin_url` (text, nullable)
- `github_url` (text, nullable)
- `portfolio_url` (text, nullable)
- `phone` (text, nullable)
- `has_completed_onboarding` (boolean, default false)
- `created_at` (timestamp with time zone, nullable)
- `updated_at` (timestamp with time zone, nullable)

### 4. `users`
Secondary user table used by settings/profile (may be phased out in favor of `profiles`).

- `id` (uuid, primary key)
- `email` (text, nullable)
- `name` (text, nullable)
- `full_name` (text, nullable)
- `display_name` (text, nullable)
- `avatar_url` (text, nullable)
- `bio` (text, nullable)
- `professional_summary` (text, nullable)
- `skills` (text[], nullable)
- `experience_level` (text, nullable)
- `industry` (text, nullable)
- `location` (text, nullable)
- `linkedin_url` (text, nullable)
- `github_url` (text, nullable)
- `portfolio_url` (text, nullable)
- `phone` (text, nullable)
- `drive_folder_id` (text, nullable)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)

### 5. `scrape_configs`
Configuration for scraping behavior.

- `id` (bigint, primary key)
- `user_id` (uuid, foreign key to auth.users)
- `domain` (text, nullable)
- `field` (text, nullable)
- `selector` (text, nullable)
- `platform` (text, nullable)
- `keywords` (text[], nullable)
- `location` (text, nullable)
- `remote_only` (boolean, nullable)
- `active` (boolean, nullable)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)

*(Additional tables like `feedback`, `contact_submissions`, `ai_outputs`, `ai_credits`, `ai_credit_transactions` exist but are either optional for MVP or handled via simple insert-only patterns).*

## Remote Procedure Calls (RPCs)

- `get_recent_activity()`: Returns `{ applications_submitted: number, interviews_landed: number, average_response_time_days: number | null }`.
- `get_application_time_series()`: Returns array of `{ date: string, applications: number, interviews: number, offers: number }`.
- `get_application_insights()`: Returns JSON containing analytics insights.

*Note: Frontend usage of `get_user_analytics_v2` has been removed or hidden for the first launch due to contract mismatch.*

## Row Level Security (RLS) Policies

All tables accessed by the client must have RLS enabled.
General pattern for user-owned tables (`applications`, `resumes`, `scrape_configs`, `ai_outputs`):
- **SELECT**: `auth.uid() = user_id`
- **INSERT**: `auth.uid() = user_id`
- **UPDATE**: `auth.uid() = user_id`
- **DELETE**: `auth.uid() = user_id`

For `profiles` and `users`:
- **SELECT**: `auth.uid() = id`
- **UPDATE**: `auth.uid() = id`

For `feedback`:
- **INSERT**: `auth.uid() = user_id` (or anonymous insert if allowed)

For `contact_submissions`:
- **INSERT**: public allowed

## Storage Buckets

1. **`resumes`**:
   - Stores raw or parsed resume files.
   - RLS: Users can upload, read, update, and delete files inside a folder matching their `auth.uid()`.

2. **`avatars`**:
   - Stores user avatar images.
   - RLS: Public read access. Users can upload, update, and delete files matching their `auth.uid()`.

## Edge Functions

The following Edge Functions must be deployed and correctly configured with CORS and auth headers:
- `ai-generate`
- `scrape-url`
- `upload-resume`
- `resumes-create`
- `delete-user`

All edge functions must verify JWTs correctly. `_shared/db.ts` or auth helpers must treat `user_id` as a UUID string, not an integer.
