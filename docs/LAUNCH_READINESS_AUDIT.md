# JATA v2 Launch Readiness Audit

Date: 2026-05-02
Branch: `chore/launch-readiness-audit`
Base branch: `develop`
Scope: Audit only. No product fixes, deployments, Supabase pushes, or generated build artifacts are part of this branch.

## Executive Summary

JATA v2 can install, test, and build from the rescued monorepo baseline, but it is not launch-ready yet. The first usable launch is blocked by schema/frontend mismatches in the core application tracking flow, broken dashboard navigation links, hardcoded local Edge Function URLs, incomplete Supabase setup, and stale typed database artifacts.

The fastest launch path is a small P0 fixes branch focused on making auth, manual application creation, dashboard listing, resume upload or local upload fallback, and basic AI generation work against one Supabase Free project and one Vercel preview.

## Workspace Hygiene Result

- Active branch: `chore/launch-readiness-audit`.
- Remote fetch: `git fetch origin --prune` succeeded after running outside the sandbox because `.git/FETCH_HEAD` was not writable in the first attempt.
- Branch relationship check: `git rev-list --left-right --count origin/develop...origin/main` returned `1 1`.
- Gitlinks: no tracked `160000` entries were found.
- `.gitmodules`: not present.
- Generated extension JS before validation: no diff.
- Generated extension JS after build: dirty output appeared in:
  - `apps/extension/src/background.js`
  - `apps/extension/src/contentScripts/scraper.js`
  - `apps/extension/src/lib/supabaseClient.js`
- Matching TypeScript sources had no diff, so only those generated JS files were restored.
- Remaining untracked local dirt left untouched:
  - `audit_output.txt`
  - `jata/`, which contains its own `.git` and looks like the old nested workspace. It was not used, modified, or staged.

## Baseline Validation

| Command | Result | Classification |
| --- | --- | --- |
| `pnpm install --frozen-lockfile` | Passed after approval for registry access. First sandbox attempt failed with EACCES on registry tarball fetch. | Environment constraint, then pass |
| `pnpm test` | Passed after approval. First sandbox attempt failed with `spawn EPERM` while Vite/esbuild loaded config. | Environment constraint, then pass |
| `pnpm build` | Passed using Turbo cache from the successful test build. | Pass |
| `pnpm --filter @jata/web lint` | Failed with 32 errors and 3 warnings. | Existing debt |
| `pnpm --filter @jata/web build` | Passed. Warned about missing Sentry auth token, old Browserslist data, and large JS chunk. | Pass with warnings |
| `pnpm --filter @jata/extension build` | Passed. Warned about old Browserslist data. | Pass with warnings |
| `pnpm --filter @jata/web exec tsc --noEmit --pretty false` | Failed because resolved TypeScript 4.9.5 does not understand the root tsconfig options `moduleResolution: bundler` and `allowImportingTsExtensions`. | P1 launch risk |

## Route Map

Public routes:

- `/` -> `LandingPage`
- `/signin` -> `SigninPage`
- `/signup` -> `SignupPage`
- `/update-password` -> `UpdatePasswordPage`
- `/auth/callback` -> `AuthCallbackPage`
- `/auth/confirm` -> `AuthCallbackPage`
- `/faq` -> `FAQPage`
- `/contact` -> `ContactPage`
- `/privacy` -> `PrivacyPolicyPage`
- `/terms` -> `TermsOfServicePage`
- `/error` -> `ErrorPage`
- `*` -> `NotFoundPage`

Protected routes:

- `/dashboard` -> `Dashboard`
- `/resume-tailor/:id` -> `ResumeTailorPage`
- `/profile` -> `ProfilePage`
- `/settings` -> `Settings`
- `/analytics` -> `AnalyticsPage`
- `/cover-letter` -> `CoverLetterPage`
- `/install-extension` -> `InstallExtensionPage`
- `/diagnostic` -> `DiagnosticPage`

Sidebar links with no matching route:

- `/applications`
- `/resume-vault`

These links are visible inside `DashboardLayout`, so authenticated users can click into missing routes during first launch.

## Runtime Page Assessment

| Page | Auth | Supabase data | Mock/local data | Launch assessment |
| --- | --- | --- | --- | --- |
| Landing, FAQ, terms, privacy | No | No | Static content | Safe for preview |
| Contact | No | `contact_submissions` insert | Local rate limit in localStorage | Depends on table/RLS migration |
| Signin/signup/update password/callback | No | Supabase Auth | None | P0 requires production redirect URL setup |
| Dashboard | Yes | `applications`, `get_recent_activity` | Welcome empty state | P0 blocked by application schema mismatch |
| Create application modal | Yes | `applications` insert | None | P0 blocked by wrong column names and status values |
| Resume tailor | Yes | `applications`, `resumes`, `scrape-url`, `ai-generate` | Local file text extraction and AI fallback | P0 if included in first launch, otherwise P1 |
| Profile | Yes | `resumes`, `upload-resume` | None | P0/P1 blocked by localhost Edge Function URL |
| Settings | Yes | `users`, `profiles`, `delete-user`, optional Google OAuth | localStorage settings fallback | P1 risk |
| Analytics | Yes | `get_user_analytics_v2`, `get_application_time_series`, `get_application_insights` | No mock fixture | P1 unless promoted as core launch page |
| Install extension | Yes | No direct DB | Browser detection, mocked zip fetch path | P1, not ready for public launch |
| Diagnostic | Yes | `applications`, `profiles`, `get_recent_activity` | None | Internal-only route, should not be user-facing |

## P0 Launch Blockers

1. Manual application creation does not match the database schema.
   - `CreateApplicationModal` inserts `job_title`, `company_name`, `job_url`, `location`, `salary_range`, and lowercase statuses such as `saved`.
   - The remote schema migration expects `title`, `company`, `url`, `date_applied`, and status values such as `Applied`, `Interview`, `Offer`, and `Rejected`.
   - Result: first core user action likely fails.

2. Dashboard and cards assume fields/statuses that are inconsistent with creation flow.
   - `ApplicationCard` renders `title`, `company`, and `date_applied`.
   - Dashboard stats check lowercase statuses such as `applied`, `interviewing`, and `offer`.
   - Result: even if records exist, statistics can be wrong and new records can be unusable.

3. Sidebar exposes missing routes.
   - `/applications` and `/resume-vault` are in `Sidebar.tsx` but not in `App.tsx`.
   - Result: authenticated navigation has broken first-party links.

4. Production Edge Function calls are hardcoded to local URLs.
   - `ProfilePage` calls `http://localhost:54321/functions/v1/upload-resume`.
   - `ResumeTailorPage` calls `http://localhost:54321/functions/v1/scrape-url`.
   - Result: deployed preview cannot use resume upload or URL scraping.

5. Supabase RPC contract for analytics is mismatched.
   - Frontend calls `supabase.rpc('get_user_analytics_v2')` with no args.
   - The only migration defining that function creates `get_user_analytics_v2(user_uuid uuid)`, and the later remote schema migration drops it.
   - Result: analytics route likely errors in production.

6. Typed database source is broken/stale.
   - `apps/web/src/lib/supabaseClient.ts` imports `Database` from `packages/common/src/database.types.ts`, but that file is empty.
   - `@jata/common` exports a different type file at `packages/common/types/database.ts`.
   - Result: Vite build passes because it does not typecheck, but schema drift is hidden.

7. Vercel config is stale for the current Vite SPA deployment shape.
   - `vercel.json` uses legacy `builds` and routes to `/apps/web/$1`.
   - A Vite SPA needs static output from `apps/web/dist` and a fallback rewrite to `index.html`.

## P1 Launch Risks

- Web lint fails with existing unused vars, `any`, and hook/refresh warnings.
- Targeted web typecheck cannot run because `tsc` resolves to 4.9.5 for the command tested.
- `getUserId()` in Supabase shared function code parses UUID user IDs as integers, so application/resume Edge Functions using it are not safe as written.
- `resumes-create` expects `resume_name` and `resume_text`, but `fileUploadService.uploadResume()` sends `file_name` and `content`.
- `scrape-url` returns `{ content }`, while `ResumeTailorPage` reads `article.textContent`.
- `delete-user` relies on `SUPABASE_SERVICE_ROLE_KEY` and avatar storage bucket wiring.
- `PostHogProvider` is optional, but `SigninPage` calls `usePostHog().capture()`. This should be checked without PostHog env configured.
- Extension download route points to `/extension/jata-extension.zip`, but zip artifacts should not be tracked in this repo.
- Sentry source map upload warnings are expected without `SENTRY_AUTH_TOKEN`; this should not block first preview.

## Existing Debt That Should Not Block Launch

- Current lint errors across chart components, `AuthContext`, `DiagnosticPage`, and upload services.
- Old Browserslist database warnings.
- Large web bundle warning from Vite.
- Historical Netlify references in older docs.
- Root `package-lock.json` exists alongside `pnpm-lock.yaml`; do not switch package managers in the launch audit branch.

## Analytics Diagnosis

Analytics components present:

- `AnalyticsSummaryCards`
- `ApplicationFunnelChart`
- `ScoreAnalysisChart`
- `SuccessBySourceChart`
- `SuccessByIndustryChart`
- `ApplicationTimeSeriesChart`
- `ApplicationInsights`

Expected data shapes:

- Funnel: `{ total_applications, interviews, offers }`
- Score analysis: `{ status, count, average_score }[]`
- Source/industry: `{ source|industry, total_applications, interviews, offers }[]`
- Time series: `{ date, applications, interviews, offers }[]`
- Insights: `{ totalApplications, interviewRate, offerRate, averageResponseTime, weekOverWeekChange, topPerformingSource, topPerformingIndustry }`

Schema/RPC status:

- `get_application_time_series()` exists in `20251029120000_create_advanced_analytics_functions.sql`.
- `get_application_insights()` exists in `20251029120000_create_advanced_analytics_functions.sql`.
- `get_user_analytics_v2` does not match the frontend call. It is defined with a required `user_uuid` parameter in one migration and then dropped by `20250829085429_remote_schema.sql`.
- Existing analytics SQL uses Title Case statuses, while dashboard stats use lowercase statuses.

Launch recommendation:

- Do not block first preview on polished analytics.
- P0 fix should either repair the analytics RPC contract or remove/hide the analytics nav until the RPC is aligned.
- Mock analytics can be acceptable only as a clearly marked temporary UI state. Current code does not provide mock analytics data.

## Minimum First Usable Launch Surface

The minimum credible launch is:

- Public landing page, FAQ, contact, privacy, and terms.
- Supabase email/password signup, signin, email confirmation, password reset.
- Protected dashboard with empty state and manual application create/list.
- Resume tailoring using pasted/uploaded local text and AI mock fallback.
- Cover letter generator using Edge Function when available and local fallback otherwise.
- Settings limited to safe profile/preferences, with destructive account deletion only after Edge Function verification.

Postpone until after P0:

- Analytics polish.
- Extension download/install flow.
- Google Drive integration.
- Diagnostic route.
- Public source map upload via Sentry.

## Recommended Next Branches

- `fix/p0-launch-core-flow`: schema/frontend alignment, route cleanup, local URL removal, Vercel config cleanup.
- `fix/supabase-free-launch-wiring`: migrations, RLS verification, Edge Function deployment checklist execution.
- `fix/analytics-runtime-contract`: analytics RPC and chart data contract repair.
- `chore/lint-and-typecheck-baseline`: typecheck/lint tooling normalization after launch blockers are fixed.

## Exact Next Codex Prompt For P0 Fixes

```text
You are Codex working in C:\Users\PC\Documents\My journey\Build Projects\Gemini-cli\jata_build\jata_v2.

Branch from develop into fix/p0-launch-core-flow. Do not work from master. Do not deploy. Do not run supabase db push. Do not print secrets.

Goal: Fix only P0 launch blockers from docs/LAUNCH_READINESS_AUDIT.md so the first Vercel preview can support auth, dashboard, manual application create/list, resume/cover-letter generation fallbacks, and safe navigation.

Required steps:
1. Start with git fetch origin --prune, git status --short --branch, and confirm the branch is fix/p0-launch-core-flow.
2. Restore any generated extension JS if it is dirty and matching TS sources are unchanged.
3. Align CreateApplicationModal, Dashboard stats, ApplicationCard, and status labels with the current Supabase applications schema or document a minimal migration if code-only alignment is impossible.
4. Remove or route the broken sidebar links /applications and /resume-vault.
5. Replace localhost Edge Function URLs with Supabase functions invoke or VITE_SUPABASE_URL derived URLs.
6. Fix the analytics route enough that it does not break first launch: either correct the RPC call/shape or temporarily hide analytics navigation with clear follow-up docs.
7. Fix stale Database type import/source enough that web typechecking can run with the repo's intended TypeScript version.
8. Update .env.example only with placeholder variable names if new env vars are needed. Never include real values.
9. Do not fix unrelated lint debt.

Acceptance criteria:
- pnpm install --frozen-lockfile
- pnpm --filter @jata/web build
- pnpm --filter @jata/extension build
- A targeted manual QA checklist for auth, dashboard empty state, manual application creation, resume tailor fallback, cover letter fallback, and navigation.
- git status must show only intentional source/docs/env-example changes and no generated JS, dist, env, temp, node_modules, zip, or nested jata artifacts staged.

Output:
- Files changed
- Commands run and results
- Remaining P0/P1 risks
- Exact next human Supabase and Vercel steps
```
