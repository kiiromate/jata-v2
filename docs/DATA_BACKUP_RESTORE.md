# Data Backup and Restore

This document defines the local backup path for JATA user data. It is designed for operator-controlled exports, not cloud backup automation.

## What Gets Exported

The full-fidelity JSON backup is written to:

```text
exports/jata-export-<timestamp>/backup.json
```

It includes:

- `applications`: application and opportunity rows from `public.applications`.
- `captureInbox`: Capture Inbox metadata stored on application rows.
- `scoresAndBands`: `jata_score`, score band, score status, score result metadata, and score timestamps.
- `pipeline`: application status, capture status, and key lifecycle timestamps.
- `actionLogs`: flattened Capture Inbox action log events.
- `followUps`: derived follow-up queue rows for interviews, offers, shortlisted, ready, and pack-pending records.
- `resumeMetadata`: resume filename, timestamps, and content length only.
- `aiOutputMetadata`: provider/model/task/hash/count/latency/status metadata only.
- `generatedPackMetadata`: application-level pack metadata only.

CSV files are also written for:

- `applications.csv`
- `capture-inbox.csv`
- `pipeline.csv`
- `follow-ups.csv`
- `scores.csv`

## What Is Excluded

The export tooling does not export:

- Supabase keys.
- Provider API keys.
- `.env`, `.mcp.json`, or local agent state.
- Raw auth tokens.
- Raw AI output payloads.
- Raw AI error text.
- Raw resume content in `resumeMetadata`.
- Generated pack archive files, because the current schema has no dedicated generated-pack storage table or bucket.

`applications.final_resume_text` remains part of the full application row backup because it is currently stored on `public.applications`. Treat every export directory as private local data.

## Local Export Commands

Set private environment values in your shell or ignored `.env` file. Never add real values to `.env.example`.

Required:

```powershell
$env:SUPABASE_URL="https://your-project.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="<private local value>"
$env:JATA_EXPORT_USER_ID="<user uuid>"
```

Run:

```powershell
pnpm data:export
```

Optional output directory:

```powershell
$env:JATA_EXPORT_DIR="exports/manual-checkpoint"
pnpm data:export
```

Export directories are ignored by Git.

## Integrity Check

Run:

```powershell
pnpm data:check
```

The check reports:

- Missing `user_id`.
- Missing title or company.
- Invalid application status.
- Duplicate source URL or URL.
- Capture metadata without `capture_status`.
- Pack metadata without an application reference.

The command exits with code `1` if issues are found.

## Manual Restore Path

1. Open `backup.json`.
2. Confirm the `user_id`, `exported_at`, and `schema_version`.
3. Restore `applications` first into `public.applications`.
4. Restore Capture Inbox fields as part of the same application rows.
5. Restore resume files manually from the original private resume source, using `resumeMetadata` only as an index.
6. Recreate generated packs manually from application metadata and verified source documents if needed.
7. Do not restore AI output payloads from this export; only metadata is preserved.
8. Run `pnpm data:check` after restore to confirm basic row integrity.

Do not run `supabase db push` as part of restore unless the migrations have already been reviewed for the target project.
