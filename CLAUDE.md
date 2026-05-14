# JATA v2 — Agent Operating Guide

Read this before writing any code, running any build, or making any commit.

## What This Is

JATA is a job search operating system. The core loop is:

1. Capture an opportunity (extension, manual, PWA share, Telegram)
2. Deduplicate and review in Capture Inbox
3. Score/shortlist
4. Generate application pack (tailored resume + cover letter + claims)
5. User reviews and downloads
6. User manually applies
7. User tracks pipeline and follow-up

**North star:** Any opportunity from anywhere → application-ready in under 5 minutes → tracked to response.

## Repo Layout

```
apps/web/              React + Vite web app
apps/extension/        Manifest V3 browser extension (Vite build)
packages/common/       Shared types, contracts, extraction adapters, pack workflow
supabase/functions/    14 Edge Functions (Deno)
supabase/migrations/   31 migrations (applied to remote)
scripts/               Security, durability, and integrity tests
```

Key packages:
- `@jata/web` — the web app
- `@jata/extension` — the browser extension
- `@jata/common` — shared types and logic

## Skills to Load

Always load the relevant skill before starting work. Skills are in `.claude/skills/`.

| Task area | Skill to load |
|-----------|--------------|
| Any JATA task (start here) | `jata-repo-context` |
| Any code change or commit | `jata-execution-discipline` |
| Capture, extension, adapters | `jata-capture-architecture` |
| Document export, DOCX, PDF | `jata-document-generation` |
| AI tasks, provider routing, prompts | `jata-ai-gateway` |
| Scoring, matching, resume parsing | `jata-scoring-design` |
| Supabase, RLS, migrations, Edge Functions | `jata-security-gate` + `jata-supabase-release` |

## Branch Rules

- Never commit to `main` directly.
- Create a task branch: `git checkout -b feature/<short-name>` or `fix/<short-name>`.
- Confirm your branch before editing: `git branch --show-current`.
- Stage only the files you changed. Never use `git add -A`.

## Validation Before Every Commit

```powershell
git diff --check
pnpm --filter @jata/web build
pnpm --filter @jata/extension build
pnpm build
```

Run these if touching security or data:
```powershell
node --test scripts/security-rls.test.mjs
node --test scripts/data-durability.test.mjs
```

## What Is Working (as of 2026-05-13)

- Manual Quick Capture
- Browser extension capture (builds; needs live retest)
- Extraction adapter registry: Greenhouse, Lever, Ashby, Workday, SmartRecruiters, genericJobPage, genericOpportunity
- Capture Inbox with deduplication and confidence badges
- Confidence scoring (extraction quality only — not job-fit)
- Multi-provider AI gateway (openrouter, huggingface, mock, none)
- AI cache via `ai_outputs` table (input hash–based)
- Cover letter generation (AI + deterministic template)
- Document export: DOCX (`docx` lib) and PDF (`jspdf`) — client-side
- Resume upload and storage
- Application CRUD and pipeline tracking
- Mark applied, follow-up
- PWA share intake (platform-dependent)
- 14 Edge Functions deployed, RLS hardening migration applied

## What Is Broken or Missing

- **Extension pick flow** — `selectionPopover.ts` closes popup on element click; re-scan overwrites picked values. State is lost between popup open/close cycles.
- **No pack generation in extension** — no path from extension to generate/download a pack on a job page.
- **No tailored resume in pack** — `generateTailoredResume` AI task returns plain text, but DOCX/PDF exporters need `TailoredResumeStructured` (JSON). This gap is unresolved.
- **No resume parsing** — uploaded resumes are not parsed into structured sections. `cvText` in AI calls may be incomplete.
- **No deterministic scoring module** — all scoring is AI-based, not evidence-grounded, not verifiable.
- **No resume bank UI** — users cannot clearly view, manage, or select between uploaded resumes.
- **Capture repair** — stub exists (`packages/common/src/extraction/repair.ts`), no provider wired.
- **Telegram intake** — not deployed; `TELEGRAM_WEBHOOK_SECRET` and `TELEGRAM_CAPTURE_USER_ID` not set.
- **Live two-user RLS smoke test** — not yet run; security gate is Yellow.

## Security Gate Status

**Yellow.** Static tests pass. Live two-user RLS smoke test is the only remaining gate item before Green.

Do not deploy to production until that test passes.

Security migration: `supabase/migrations/20260508002454_security_rls_hardening.sql` — applied.

## Do Not Build Without Explicit Request

- Auto-apply
- Payments or billing UI
- WhatsApp Business API
- Apify or Crawlee integration (plan only, no implementation)
- Playwright production crawler
- Major redesign or new frontend framework
- New database or third-party backend

## Do Not Stage

```
.env
.mcp.json
.claude/
node_modules/
dist/
*.zip
generated packs
resumes
exports
private test data
```

## Status Model

Two compatible status sets exist. Do not break either:

**Legacy (Title Case):** `Saved`, `Applying`, `Applied`, `Interview`, `Offer`, `Rejected`

**Canonical (lowercase):** `captured`, `scored`, `shortlisted`, `pack_ready`, `applied`, `follow_up_due`, `interviewing`, `rejected`, `closed`, `archived`

Remote-safe writes may still use legacy values until migration strategy is finalized.

## Report Format (end of every task)

1. Branch name
2. Commit hash (if committed)
3. Files changed
4. Validation commands run and results
5. Security impact (none / low / review needed)
6. Supabase/migration impact (none / migration required / function deployed)
7. Known blockers
8. Exact next user actions

## Key Environment Variables

```
JATA_AI_PROVIDER            (none | mock | huggingface | openrouter)
OPENROUTER_API_KEY
JATA_AI_MODEL_DEFAULT
HUGGINGFACE_API_KEY
JATA_AI_DAILY_LIMIT         (default: 20)
JATA_AI_MONTHLY_LIMIT       (default: 300)
JATA_AI_MAX_JD_CHARS        (default: 12000)
JATA_AI_MAX_CV_CHARS        (default: 12000)
TELEGRAM_WEBHOOK_SECRET     (not set — Telegram disabled)
TELEGRAM_CAPTURE_USER_ID    (not set — Telegram disabled)
```

Never commit `.env`. Never stage secrets.
