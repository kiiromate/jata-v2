# JATA Repository Audit & Practical Development Plan (2026-04-28)

## 1. Executive Summary
- JATA already has a **working private MVP backbone**: Supabase auth wiring, protected routes, application CRUD via Supabase Edge Functions, resume save flow, analytics pages, and feedback/contact scaffolding.
- The repo is **not Next.js**; it is currently a **Vite + React SPA**. Keep this for speed/cost unless there is a specific SEO/server-rendering need.
- The backend architecture docs in `docs/` are partially stale versus the real code (they reference Netlify/Express/Prisma patterns not reflected in the current Supabase-first implementation).
- Main blockers for safe public beta are: schema drift, inconsistent generated DB types, limited admin controls, and incomplete credit/abuse controls.
- Recommendation: do a **focused Supabase reconstruction + schema normalization sprint** and ship v0.1 within 14 days, prioritizing truthful ATS optimization workflows over automation.

## 2. Current Repository Architecture
- Monorepo with:
  - `apps/web` (React + Vite frontend).
  - `supabase/` (migrations + edge functions).
  - `packages/common` (shared types, including DB typings).
- Frontend runtime stack: React, React Router, TanStack Query, Zustand, Supabase JS, PostHog, Sentry.
- Backend execution model: Supabase Postgres + Supabase Edge Functions (Deno TypeScript).
- Auth/data path:
  1. Client initializes Supabase using `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
  2. `AuthContext` reads session and profile from `profiles`.
  3. Protected routes gate dashboard, profile, analytics, tailoring, settings.

## 3. Existing Features
- Authentication UX exists: sign in, sign up, callback/confirm, update password.
- Job CRM core exists:
  - Dashboard route and application-focused UI/components.
  - Edge functions for `applications-create/read/update/delete`.
- Resume flows exist:
  - Resume-related UI pages/components and `resumes-create` function.
- AI-related UX exists:
  - Resume tailoring page.
  - Cover letter page.
  - Hugging Face-based service modules for generation/analysis.
- Observability exists:
  - Optional PostHog provider.
  - Optional Sentry initialization in production.
- Feedback/contact foundations exist:
  - Feedback UI components/services.
  - Migrations for `feedback` and `contact_submissions`.

## 4. Broken or Incomplete Features
- **Type drift risk is high**:
  - `packages/common/src/database.types.ts` is empty.
  - `packages/common/types/database.ts` and `packages/common/src/database.types.new.ts` disagree on schema shape.
- **Schema churn visible**:
  - Migrations indicate several add/drop cycles (especially `applications`, `resumes`, analytics RPCs), increasing uncertainty when recreating Supabase from scratch.
- **Admin system incomplete**:
  - There is no clear dedicated admin web route/dashboard with robust RBAC guardrails yet.
- **AI provider coupling**:
  - Current AI logic is tied to Hugging Face env key usage; abstraction is partial, not fully provider-pluggable.
- **Storage strategy is not fully standardized**:
  - File/document handling exists, but naming, bucket policy consistency, and user-scoped path conventions need hardening.
- **Public safety gaps**:
  - No mature abuse controls/quotas for costly AI calls.
  - No complete credit/entitlement transaction model implemented end-to-end.

## 5. Supabase Reconstruction Plan
1. Create a fresh Supabase project and link locally.
2. Freeze migration baseline:
   - Reorder/clean migration history if needed into a deterministic bootstrap set.
   - Validate `supabase db reset` succeeds from zero.
3. Generate a new canonical schema snapshot.
4. Regenerate **one** DB types file and make all imports use it.
5. Recreate storage buckets:
   - `user-documents` (private)
   - `generated-documents` (private)
   - optional `avatars` (public or signed URL pattern)
6. Re-apply RLS and verify with test users.
7. Deploy edge functions and smoke test each endpoint.

## 6. Proposed Database Schema
Adopt/extend toward the requested product model:
- `profiles` (1:1 auth user metadata)
- `user_documents` (CVs, versions, parsed text, file metadata)
- `job_posts` (saved JD text/url/source)
- `applications` (status pipeline + links to document/job)
- `application_events` (timeline changes)
- `ai_outputs` (prompt/input refs, output, model/provider, latency/tokens, quality flags)
- `feedback` (output-specific thumbs up/down + comments)
- `credits` (current balance/plan)
- `credit_transactions` (immutable ledger)
- `user_settings` (preferences, locale, tone defaults)
- `admin_notes` (internal support/review notes)

Design rules:
- Every user-owned table includes `user_id uuid not null`.
- Enable RLS on all user-owned tables.
- Index `user_id`, and on frequent filters (`created_at`, `status`, `application_id`).
- Use `application_events` rather than overloading `applications` with every historical state.

## 7. Authentication and Security Review
Current strengths:
- Supabase Auth + protected routes are in place.
- RLS migrations are present for major tables.

Priority fixes:
- Consolidate profile/user identity model (avoid duplicative `users` vs `profiles` confusion).
- Ensure all edge functions enforce JWT context and user ownership checks.
- Add explicit admin authorization strategy (e.g., `profiles.role = 'admin'` + strict policies).
- Add rate limits/throttling around AI-triggering endpoints.
- Add audit logging for privileged/admin actions.

## 8. Storage and File Handling Plan
- Standardize to Supabase Storage with user-scoped keys:
  - `user_id/cvs/{doc_id}/{version}.pdf`
  - `user_id/jobs/{job_id}/source.txt`
  - `user_id/generated/{application_id}/{artifact}.md`
- Store metadata in `user_documents` and `job_posts`; never trust filename-only logic.
- Keep raw file + extracted text separately.
- Enforce MIME/size checks and malware-safe handling assumptions.
- Prefer signed URLs for private downloads; avoid public bucket exposure for resumes.

## 9. AI Feature Architecture
Implement a provider-agnostic interface:
- `AIProvider` contract (`analyzeCvMatch`, `suggestImprovements`, `generateCoverLetter`, `generateRecruiterMessage`).
- Adapter modules:
  - `huggingfaceProvider` (initial low-cost path)
  - future: `openaiProvider`, `anthropicProvider`, local/inference endpoint.
- Persist request/response metadata to `ai_outputs` for debugging and quality review.
- Add deterministic fallback prompts and graceful error states.
- Add lightweight cost controls:
  - per-user daily request cap,
  - max token/char input bounds,
  - cache identical CV+JD analyses.

## 10. Admin and Feedback System Plan
Phase-1 admin requirements:
- Admin-only page for:
  - user list and status,
  - feedback queue,
  - failed AI outputs,
  - usage summaries (daily requests, error rates).
- Feedback UX:
  - thumbs up/down + optional reason text on each AI output.
- Operational workflows:
  - mark feedback as reviewed,
  - add `admin_notes`,
  - classify issue types (hallucination, tone mismatch, weak ATS alignment).

## 11. Credit and Monetization Architecture
Do **not** integrate payment now; make it ready.
- Implement internal credits now:
  - `credits` balance table,
  - `credit_transactions` ledger table.
- Free-tier design example:
  - X CV-job analyses/day,
  - Y cover letters/week.
- All AI endpoints must check entitlement before run and deduct on success.
- Add anti-abuse:
  - per-IP + per-user rate limiting,
  - suspicious burst detection,
  - optional cooldown on repeated failures.

## 12. Public Beta Readiness Checklist
- [ ] Fresh Supabase project bootstrapped from migrations successfully.
- [ ] Single canonical DB types file regenerated and imported everywhere.
- [ ] RLS verified for every user-owned table with two-user test.
- [ ] Storage buckets + policies validated using signed URL flows.
- [ ] Auth callbacks and password reset fully tested in prod URL.
- [ ] AI error handling/fallback states tested (timeouts, provider failure).
- [ ] Basic admin review surface live.
- [ ] Feedback loop data visible to founder/admin.
- [ ] Basic usage limits enabled.
- [ ] Privacy policy/terms/contact pages linked in production footer.

## 13. Immediate Fixes (Do First)
1. Canonicalize schema/types (`db reset` + regenerate types + remove stale type files).
2. Add a migration for core missing v0.1 tables (`ai_outputs`, `application_events`, `credits`, `credit_transactions`, `user_settings`, `admin_notes`, `user_documents`, `job_posts` if absent).
3. Add admin role + admin RLS policies.
4. Harden file upload/storage paths and policy checks.
5. Introduce AI provider abstraction layer without changing UX yet.
6. Add usage limiter middleware/helper for AI routes/functions.

## 14. 14-Day Development Roadmap
### Days 1-2: Stabilize foundation
- Recreate Supabase project.
- Validate migrations from zero.
- Regenerate DB types and fix imports.

### Days 3-4: Data model completion
- Add missing v0.1 tables and indexes.
- Add RLS and policy tests for all tables.

### Days 5-6: Core UX reliability
- Ensure CV upload + JD save + application create/edit flows are robust.
- Add clearer error/success messaging and empty states.

### Days 7-8: AI reliability layer
- Implement provider interface + HF adapter.
- Save AI output metadata and feedback linkage.

### Days 9-10: Admin MVP
- Build admin page with user/feedback/usage views.
- Add review status and admin notes workflow.

### Days 11-12: Safety + limits
- Add credits ledger and free-tier caps.
- Add throttling and abuse safeguards.

### Days 13-14: Launch prep
- Deploy on Vercel + Supabase.
- Configure `jata.kazekeza.xyz` subdomain.
- Run end-to-end smoke tests and ship private MVP v0.1.

## 15. Exact Next Codex Prompts
1. **Schema normalization prompt**  
   “Audit all Supabase migrations, produce a canonical baseline migration set, and ensure `supabase db reset` succeeds. Then regenerate one canonical `database.types.ts` and update all imports to use it.”

2. **RLS hardening prompt**  
   “Create/patch migrations to enforce RLS on every user-owned table, add admin role policies, and provide SQL test queries proving users cannot access each other’s data.”

3. **AI abstraction prompt**  
   “Refactor current AI services into a provider interface with a HuggingFace adapter, add structured logging to `ai_outputs`, and keep current UI behavior unchanged.”

4. **Admin MVP prompt**  
   “Implement an admin-only dashboard route showing users, feedback queue, failed AI outputs, and daily usage summaries from Supabase.”

5. **Credits prompt**  
   “Implement `credits` and `credit_transactions` with helper functions for consume/refund, and gate AI endpoints with free-tier limits.”

6. **Launch hardening prompt**  
   “Run a production-readiness pass: auth flows, storage policies, error boundaries, analytics events, and a deployment checklist for Vercel + Supabase + `jata.kazekeza.xyz`.”
