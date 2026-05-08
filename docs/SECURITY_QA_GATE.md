# JATA v1 Security QA Gate

Date: 2026-05-08  
Branch: `security/v1-rls-edge-gate`  
Scope: multi-user isolation, RLS, storage, Edge Functions, extension auth sync, PWA/Telegram intake, exports, and secret/artifact hygiene.

## Verdict

Yellow: safe for controlled testing after the new security migration is dry-run reviewed and applied. Do not treat this as a release-green gate until authenticated two-user RLS smoke tests run against the target Supabase project.

## User-Data Surface Inventory

| Surface | Owner column/path | RLS/policy | Status | Notes |
| --- | --- | --- | --- | --- |
| `applications` | `user_id` | select/insert/update/delete owner-scoped | Pass after migration | Capture Inbox, pipeline, follow-up, generated-pack metadata, and action log data live here. New migration makes update `WITH CHECK` explicit. |
| Capture Inbox | `applications.user_id` | inherited from `applications` | Pass after migration | No separate capture table. |
| `resumes` | `user_id` | select/insert/update/delete owner-scoped | Pass after migration | New migration makes update `WITH CHECK` explicit. |
| `profiles` | `id = auth.uid()` | select/update own profile | Pass | Insert is trigger/service-owned. |
| `users` | `id = auth.uid()` | select/update own row | Pass after migration | New migration collapses duplicate update policies into one explicit owner policy. |
| `feedback` | `user_id` | select/insert/update own rows | Pass | No public select. No delete policy present. |
| `contact_submissions` | email-based self-select | public insert, authenticated self-select by auth email | Partial/intended | Public insert is intentional for contact form. Public select is not present. |
| `ai_outputs` | `user_id` | select/insert own rows | Pass | Append-only metadata/cache table. |
| `scrape_configs` | `user_id` | select/insert/update/delete own rows | Pass after migration | New migration makes update `WITH CHECK` explicit. |
| Exports/backups | `JATA_EXPORT_USER_ID` filter | script-level filter | Partial | Local scripts refuse all-user export without explicit user id; outputs are ignored by git. |

## Storage Audit

| Bucket | Public/private | Owner path rule | Read | Write/delete | Status |
| --- | --- | --- | --- | --- | --- |
| `resumes` | private | first folder segment must equal `auth.uid()` | owner only | owner only | Pass |
| `avatars` | public | first folder segment must equal `auth.uid()` | public | owner only | Partial/intended |

Avatars are intentionally public per `docs/SUPABASE_CONTRACT.md`. User-specific writes still require the user-id folder path.

## Edge Function Audit

| Function | Auth required | User derived server-side | Service role | Owner checks | Status |
| --- | --- | --- | --- | --- | --- |
| `ai-generate` | yes | `supabase.auth.getUser()` | no | user id passed to AI usage/output stores | Pass |
| `capture-inbox` | yes | `getUserId(req)` | no | repository filters by `user_id` | Pass |
| `scrape-url` | yes after patch | `getUserId(req)` | no | no data rows; URL target safety added | Pass after deploy |
| `upload-resume` | yes | `getUserId(req)` | no | storage path and DB insert use JWT user | Pass |
| `resumes-create` | yes | `getUserId(req)` | no | DB insert uses JWT user | Pass |
| `delete-user` | yes | verified JWT user | yes | target user is now `user.id`, not request body | Pass after deploy |
| `telegram-intake` | webhook secret or explicit dev mode | server env `TELEGRAM_CAPTURE_USER_ID` | yes | client/Telegram payload cannot choose owner | Pass |
| `applications-create` | yes after patch ordering | `getUserId(req)` | no | insert overwrites `user_id` with JWT user | Pass |
| `applications-read` | yes | `getUserId(req)` | no | filters by `user_id` | Pass |
| `applications-update` | yes | `getUserId(req)` | no | filters by `id` and `user_id` | Pass |
| `applications-delete` | yes | `getUserId(req)` | no | filters by `id` and `user_id` | Pass |
| `save-application-analysis` | yes | `getUserId(req)` | no | now checks application and selected resume owner | Pass after deploy |

CORS remains broad (`Access-Control-Allow-Origin: *`) but private functions require JWT or Telegram webhook secret. Restricting allowed origins is a future hardening item, not a current cross-user data blocker.

## PWA, Extension, Telegram

| Surface | Owner-scoped | Tested | Risk | Fix needed |
| --- | --- | --- | --- | --- |
| PWA share | yes, backend derives user through `capture-inbox` | static only | low | live auth test |
| Browser extension | yes, capture function derives user from session JWT | static only | medium reduced to low | rebuild extension and test auth sync |
| Telegram | yes, server env owns all Telegram captures | static only | medium | deploy only with webhook secret in production |

Extension auth-sync no longer trusts every `*.vercel.app` origin. It allows local dev, production origins, exact `jata-app.vercel.app`, and `jata-*` Vercel preview hosts.

## Secrets And Artifacts

Terms checked: `SUPABASE_SERVICE_ROLE_KEY`, `service_role`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `OPENROUTER_API_KEY`, `HUGGINGFACE_API_KEY`, `SENTRY_AUTH_TOKEN`, `sbp_`, `eyJ`, `sk-`, `Bearer`, `password`, `.env`, `.mcp.json`, `.claude`.

Findings:

- `.mcp.json` is ignored and untracked, but contains live-looking connector tokens. Rotate them if they are real.
- `apps/web/.env` and `apps/extension/.env` are ignored and untracked, and contain JWT-shaped values. Do not commit them.
- `.env.example` and docs contain placeholder env names only.
- No generated exports, backups, resume folders, dist folders, or zip artifacts are currently staged.

## Migration Status

Security migration created:

- `supabase/migrations/20260508002454_security_rls_hardening.sql`

It has not been applied. It:

- recreates update policies for `applications`, `resumes`, `scrape_configs`, and `users` with explicit owner `USING` and `WITH CHECK`.
- drops stale `get_user_analytics_v2(uuid)` if present.
- replaces `get_recent_activity()` with a fixed `search_path`.

Remote db push run: no.

Recommended dry-run:

```powershell
pnpm exec supabase migration list --linked
pnpm exec supabase db push --dry-run
```

Apply only after the dry-run shows this migration as the only intended pending migration:

```powershell
pnpm exec supabase db push
```

## Security Tests

Added:

- `scripts/security-rls.test.mjs`

Run:

```powershell
node --test scripts/security-rls.test.mjs
```

The script performs static regression checks for:

- explicit update `WITH CHECK` owner policies.
- `delete-user` deriving target user from verified JWT.
- `scrape-url` requiring auth and rejecting unsafe URL targets.
- `save-application-analysis` verifying selected resume ownership.
- extension auth sync not trusting arbitrary Vercel apps.

Live two-user smoke tests are still required before release.
