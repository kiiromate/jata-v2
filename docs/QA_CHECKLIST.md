# JATA v2 Manual QA Checklist

Date: 2026-05-02
Scope: Manual launch-readiness checks after P0 fixes. Do not use this checklist to justify deployment before P0 blockers are fixed.

## Pre-QA Safety

- [ ] Confirm branch is not `master`.
- [ ] Confirm no deploy is running automatically from the audit branch.
- [ ] Confirm `git status --short` has no generated JS, dist, env, temp, node_modules, zip, or nested `jata/` artifacts staged.
- [ ] Confirm `.env` and provider secrets were not printed or committed.
- [ ] Confirm Supabase project URL and anon key are configured only in local env or hosting env.
- [ ] Confirm provider API keys are configured only as Supabase secrets.

## Local Validation

- [ ] `pnpm install --frozen-lockfile`
- [ ] `pnpm --filter @jata/web build`
- [ ] `pnpm --filter @jata/extension build`
- [ ] `pnpm --filter @jata/web lint` is either fixed or still documented as existing debt.
- [ ] Web typecheck has a defined command and result, or the tooling blocker is documented.

## Public Pages

- [ ] `/` renders without console errors.
- [ ] `/faq` renders.
- [ ] `/contact` renders.
- [ ] Contact form validates required fields.
- [ ] Contact form success path works if `contact_submissions` is ready.
- [ ] `/privacy` renders.
- [ ] `/terms` renders.
- [ ] Unknown public URL renders a not found page.

## Auth

- [ ] `/signup` accepts a valid email/password.
- [ ] Supabase sends the expected confirmation email if confirmations are enabled.
- [ ] Confirmation link returns to `/auth/callback` or `/auth/confirm`.
- [ ] `/signin` signs in an existing confirmed user.
- [ ] Password reset email sends from `/signin`.
- [ ] `/update-password` can update a password from the recovery flow.
- [ ] Signed-out users visiting `/dashboard` are redirected to `/signin`.
- [ ] Signed-in users can refresh `/dashboard` and remain authenticated.

## Dashboard Core Flow

- [ ] New user with zero applications sees the welcome or empty state.
- [ ] Add application modal opens.
- [ ] Required fields validate.
- [ ] Manual application creation succeeds.
- [ ] Created application appears on dashboard.
- [ ] Application card shows title, company, status, and date correctly.
- [ ] Dashboard stats match the created records.
- [ ] `get_recent_activity` either works or fails gracefully without breaking the dashboard.
- [ ] Created application rows use `title`, `company`, `url`, `source`, `industry`, `date_applied`, `status`, `id`, and `user_id` only.

## Navigation

- [ ] Every sidebar item goes to a real route or is hidden.
- [ ] `/applications` is not exposed unless implemented.
- [ ] `/resume-vault` is not exposed unless implemented.
- [ ] `/analytics` is hidden from sidebar navigation until the RPC/chart contract is fixed.
- [ ] Direct `/analytics` renders a safe unavailable state and does not crash.
- [ ] Browser back/forward works on protected routes.
- [ ] Direct refresh on `/dashboard`, `/cover-letter`, `/profile`, and `/settings` serves the SPA fallback.

## Resume Tailor

- [ ] `/resume-tailor/:id` loads an existing application.
- [ ] Pasted job description works.
- [ ] Uploaded TXT file extracts text.
- [ ] Uploaded PDF or DOCX extracts text or shows a clear error.
- [ ] Existing resume selection works if resume storage is enabled.
- [ ] Existing resume rows display `filename` and load `content`.
- [ ] URL scraping works after `scrape-url` is deployed and returns `{ content }`.
- [ ] AI analysis works with Supabase `ai-generate`.
- [ ] If AI function is unavailable, local fallback appears with human-review messaging.

## Cover Letter

- [ ] Required fields validate.
- [ ] Cover letter generation works with the mock/default provider.
- [ ] Output includes provider/model/timestamp/cache metadata when returned by the Edge Function.
- [ ] Human-review warning remains visible.
- [ ] Copy works.
- [ ] TXT download works.

## Profile And Settings

- [ ] Profile page loads without crashing.
- [ ] Resume upload uses production-safe function URL or `functions.invoke`.
- [ ] Resume list loads from the correct table columns.
- [ ] Settings load from Supabase metadata or localStorage fallback.
- [ ] Theme changes persist.
- [ ] Privacy and analytics toggles persist.
- [ ] Delete account button stays disabled until exact confirmation text is entered.
- [ ] Delete account path is tested only in a disposable account.

## Analytics

- [ ] Analytics route is hidden from navigation until fixed.
- [ ] Direct `/analytics` renders the temporary unavailable state.
- [ ] No analytics RPC calls run in the first preview.
- [ ] P1 follow-up verifies charts for sample applications after RPC repair.

## Extension

- [ ] Extension page is hidden until package/download flow is ready, or clearly labeled as manual/dev install.
- [ ] Download button points to a real downloadable artifact outside git.
- [ ] No zip artifact is tracked in this repo.
- [ ] Extension Supabase URL and anon key are set during extension build.
- [ ] Session sync origin allow list includes the actual preview/production domain.

## Deployment Preview

- [ ] Vercel build uses root repo, `pnpm install --frozen-lockfile`, `pnpm --filter @jata/web build`, and `apps/web/dist`.
- [ ] SPA fallback serves `/dashboard` and other client routes.
- [ ] Supabase Auth redirect allow list includes the preview URL.
- [ ] Required Vite env vars are present in preview.
- [ ] Sentry warnings are accepted or configured.
- [ ] PostHog absence does not break signin.

## Privacy And Security

- [ ] No service role key appears in browser code, Vite env vars, or built assets.
- [ ] No raw prompts are stored outside the metadata-only AI logging design.
- [ ] AI output remains marked for human review.
- [ ] RLS prevents viewing another user's applications, resumes, profiles, feedback, and AI outputs.
- [ ] Contact form does not expose submissions to anonymous users.
- [ ] Browser console does not log tokens or full resume/job content.

## Launch Decision

Launch is acceptable only when:

- [ ] All P0 items are fixed.
- [ ] Auth and dashboard core flow pass.
- [ ] The preview deploy passes this checklist.
- [ ] Known P1 risks are documented for the next branch.
- [ ] No forbidden artifacts are staged or committed.
