# Work Package A — Data Foundation

## Agent Role
Backend / Supabase engineer responsible for resume text extraction and opportunity data model enrichment.

## Recommended Tool
**Claude Code** (requires Supabase MCP for migration and Edge Function deployment).

## Phase
**Phase 1** — Start immediately. No dependencies on other agents.

## Branch
```
git checkout -b feature/data-foundation
```

## MCP Tools Available
- **Supabase MCP** — for `apply_migration`, `deploy_edge_function`, `execute_sql`, `list_tables`
- **brave-search** / **tavily** — for researching PDF/DOCX parsing libraries compatible with Deno
- **context7** — for package documentation (resolve library ID first, then fetch docs)

---

## Repo Context

JATA v2 is a job application system. Monorepo with pnpm workspaces + Turborepo.

```
apps/web/              React + Vite web app (@jata/web)
apps/extension/        Manifest V3 browser extension (@jata/extension)
packages/common/       Shared types, contracts (@jata/common)
supabase/functions/    14 Edge Functions (Deno runtime)
supabase/migrations/   31 migrations (applied to remote)
scripts/               Security and data tests
```

Current main commit: `e8c992a feat: complete JATA application pack export and golden path fixes`

Security gate: **Yellow** — RLS hardening migration applied, static tests pass, live two-user smoke test not yet run.

---

## File Ownership (ONLY touch these files)

```
supabase/functions/upload-resume/       ← Resume text extraction
supabase/functions/resumes-create/      ← Resume record creation
supabase/migrations/                    ← New migration file (one only)
packages/common/src/database.types.ts   ← Regenerate after migration
```

**Do NOT touch:** `apps/web/`, `apps/extension/`, `supabase/functions/_shared/ai/`, `packages/common/src/packWorkflow.ts`, `scripts/`, or any other Edge Function.

---

## Task 1: Add Resume Text Extraction to upload-resume

### Problem
When users upload a resume (PDF or DOCX), JATA stores the file but does not extract the text content. The AI gateway needs `cvText` (plain text) to run `analyzeCvMatch`, `generateCoverLetter`, `generateTailoredResume`, etc. Without extracted text, all AI tasks receive incomplete or empty input.

### What to build
Modify `supabase/functions/upload-resume/index.ts` to:

1. After successfully storing the file in Supabase Storage, extract the text content.
2. For PDF files: use a Deno-compatible PDF text extraction approach.
3. For DOCX files: use a Deno-compatible DOCX text extraction approach.
4. Store the extracted text in the `resumes` table alongside the file reference.

### Research first
Use brave-search or tavily to find:
- Deno-compatible PDF text extraction libraries (candidates: `pdf-parse`, `pdfjs-dist`, or a Deno-native solution)
- Deno-compatible DOCX text extraction (candidates: `mammoth`, manual XML extraction from DOCX zip, or a Deno-native solution)
- Check npm-to-Deno compatibility — Supabase Edge Functions run Deno, not Node.js. `npm:` specifier works for many packages but native addons do not.

**Important constraint:** The `scrape-url` Edge Function already replaced `jsdom` with `deno-dom` because jsdom's canvas native module could not bundle in Deno. Expect similar issues. Verify Deno compatibility before committing to a library.

### Implementation approach
```typescript
// Pseudocode for the extraction flow
import { extractTextFromPdf } from './parsers/pdf.ts';
import { extractTextFromDocx } from './parsers/docx.ts';

// After file upload succeeds:
const fileBuffer = await file.arrayBuffer();
const mimeType = file.type;

let extractedText = '';
if (mimeType === 'application/pdf') {
  extractedText = await extractTextFromPdf(fileBuffer);
} else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
  extractedText = await extractTextFromDocx(fileBuffer);
} else {
  // Plain text fallback
  extractedText = new TextDecoder().decode(new Uint8Array(fileBuffer));
}

// Store extracted text in the resumes table
// The column name should be `extracted_text` (TEXT, nullable)
```

### Acceptance criteria
- [ ] PDF resume upload extracts readable text content
- [ ] DOCX resume upload extracts readable text content
- [ ] Extracted text is stored in the `resumes` table in an `extracted_text` column
- [ ] Extraction failure does not block the upload — file is saved, text is null, a warning is logged
- [ ] No native binary dependencies — must run in Deno Edge Functions
- [ ] `pnpm build` passes

---

## Task 2: Enrich Opportunity Data Model

### Problem
The `applications` table captures `job_title`, `company_name`, `job_description`, `source_url`, and a few other fields. It does not capture richer context that would improve document generation quality:
- Company About text
- Work mode (remote / hybrid / onsite / unknown)
- Salary or pay range
- Application deadline
- Job type (full-time / part-time / contract / internship)
- Industry
- Location detail (city, country, region)

### What to build
Create a single migration that adds metadata columns to the `applications` table:

```sql
-- Suggested columns (adjust names to match existing conventions)
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS company_about TEXT,
  ADD COLUMN IF NOT EXISTS work_mode TEXT CHECK (work_mode IN ('remote', 'hybrid', 'onsite', 'unknown')),
  ADD COLUMN IF NOT EXISTS salary_range TEXT,
  ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS job_type TEXT CHECK (job_type IN ('full_time', 'part_time', 'contract', 'internship', 'other')),
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS location_detail TEXT;
```

Also add the `extracted_text` column to the `resumes` table:

```sql
ALTER TABLE public.resumes
  ADD COLUMN IF NOT EXISTS extracted_text TEXT;
```

### RLS impact
These are new nullable columns on existing tables with existing RLS policies. The existing `USING (auth.uid() = user_id)` policies will cover these columns automatically. **No RLS policy changes needed.**

### Naming convention
Check existing column naming in the migrations directory. The convention appears to be `snake_case`. Follow it.

### Acceptance criteria
- [ ] Single migration file created: `supabase/migrations/YYYYMMDDHHMMSS_data_foundation.sql`
- [ ] All new columns are nullable (no breaking change to existing rows)
- [ ] CHECK constraints for `work_mode` and `job_type` are present
- [ ] Migration applies cleanly to remote: `supabase db push`
- [ ] Existing data is not altered
- [ ] `pnpm build` passes after regenerating types

---

## Task 3: Regenerate Database Types

After migration is applied:

```powershell
npx supabase gen types typescript --project-id <project-id> > packages/common/src/database.types.ts
```

Or use the Supabase MCP `generate_typescript_types` tool.

### Acceptance criteria
- [ ] `packages/common/src/database.types.ts` reflects new columns
- [ ] `pnpm build` passes (type-check across all packages)

---

## Validation (run before committing)

```powershell
git diff --check
pnpm --filter @jata/web build
pnpm --filter @jata/extension build
pnpm build
node --test scripts/security-rls.test.mjs
```

---

## Git Discipline

- Stage only the files you changed. Never `git add -A`.
- Never stage `.env`, `.mcp.json`, `.claude/`, `node_modules/`, `dist/`.
- Commit message format: `feat(data): <what changed>`
- One commit per logical change (extraction, migration, types are three separate commits).

---

## Report When Done

Provide:
1. Branch name
2. Commit hashes
3. Files changed (list)
4. Validation commands run and results
5. Security impact assessment
6. Whether migration was applied to remote
7. Any blockers for Phase 2 agents

---

## Do NOT

- Do not touch any files in `apps/web/` or `apps/extension/`
- Do not modify existing Edge Functions other than `upload-resume` and `resumes-create`
- Do not modify `_shared/ai/` (Agent D owns that)
- Do not write UI code
- Do not add new Edge Functions
- Do not change existing RLS policies
- Do not use native binary dependencies (no canvas, no sharp, no node-gyp)
- Do not add a new AI provider or modify AI task types
