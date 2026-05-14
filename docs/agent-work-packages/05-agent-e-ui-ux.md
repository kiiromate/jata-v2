# Work Package E — UI / UX Overhaul

## Agent Role
Frontend engineer responsible for Resume Bank UI, Capture Inbox layout fixes, ResumeTailor page flow clarity, and pack review/download area.

## Recommended Tool
**Codex**, **Antigravity IDE**, or **Gemini CLI** — this is React component work with clear specs. No Supabase MCP or Edge Function access needed.

## Phase
**Phase 2** — Start after Agent A (Data Foundation) has merged. You depend on the enriched schema (new columns in `applications` and `resumes`), but you can start UI stubs immediately and wire data once Phase 1 merges.

## Branch
```
git checkout main && git pull
git checkout -b feature/ui-ux-overhaul
```

---

## Repo Context

JATA v2 is a job application system. The web app is a React SPA built with Vite.

### Web app structure
```
apps/web/src/
  App.tsx              ← Routes and layout
  pages/
    Dashboard.tsx
    CaptureInboxPage.tsx
    ResumeTailorPage.tsx
    CoverLetterPage.tsx
    ProfilePage.tsx
    Settings.tsx
    AnalyticsPage.tsx
    LandingPage.tsx
    ...
  components/
    ActivityCard.tsx
    ApplicationCard.tsx
    ApplicationInsights.tsx
    AvatarUpload.tsx
    CreateApplicationModal.tsx
    ...  (20+ components)
  services/
    captureInboxService.ts
    fileUploadService.ts
    aiService.ts
    aiGateway.ts
    documentExport/       ← DO NOT TOUCH (Agent D owns this)
  context/
  hooks/
  store/
  styles/
  data/
```

### Build
```powershell
pnpm --filter @jata/web build
```

### Key existing pages

**Dashboard.tsx** — Main view. Shows application pipeline, recent activity, CreateApplicationModal for manual entry.

**CaptureInboxPage.tsx** — Lists captured opportunities. Has dedup, confidence badges, action menus. Currently has scroll/layout issues and cramped action menus.

**ResumeTailorPage.tsx** — The core pack generation page. User loads a job, selects a resume, runs analysis, reviews generated pack, downloads documents. Currently the sequence is not obvious and the pack review/download area is buried.

**ProfilePage.tsx** — User profile with About Me, professional summary, contact details. Profile data should feed into pack generation.

### Supabase client
The web app uses `@supabase/supabase-js` for auth and data access. Table queries go through the Supabase client directly (no custom REST API for most CRUD).

### Status model
Two compatible status sets exist. Both must work:

**Legacy (Title Case):** `Saved`, `Applying`, `Applied`, `Interview`, `Offer`, `Rejected`

**Canonical (lowercase):** `captured`, `scored`, `shortlisted`, `pack_ready`, `applied`, `follow_up_due`, `interviewing`, `rejected`, `closed`, `archived`

---

## File Ownership (ONLY touch these files)

```
apps/web/src/pages/             ← All pages
apps/web/src/components/        ← All components (new and existing)
apps/web/src/styles/            ← CSS/styles
apps/web/src/App.tsx            ← Routing only
apps/web/src/hooks/             ← Custom hooks if needed
apps/web/src/context/           ← Context providers if needed
```

**Do NOT touch:**
- `apps/web/src/services/documentExport/` (Agent D owns this)
- `apps/web/src/services/aiService.ts` or `aiGateway.ts` (Agent D owns this)
- `apps/extension/` (Agent B owns this)
- `packages/common/` (shared contracts — coordinate if needed)
- `supabase/` (backend)

---

## Task 1: Resume Bank Page

### Problem
Users cannot see, manage, or select between their uploaded resumes. There is no dedicated resume bank page. Resume selection on ResumeTailorPage is unreliable.

### What to build
Create a new page: `ResumeBankPage.tsx`

**Route:** `/resume-bank`

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  My Resume Bank                    [Upload New]  │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────────────────────────────┐       │
│  │ Senior_Dev_Resume.pdf                │       │
│  │ Uploaded: May 10, 2026               │       │
│  │ Status: ✓ Text extracted             │       │
│  │ [View] [Download] [Delete]           │       │
│  └──────────────────────────────────────┘       │
│                                                  │
│  ┌──────────────────────────────────────┐       │
│  │ General_CV_2025.docx                 │       │
│  │ Uploaded: Apr 22, 2026               │       │
│  │ Status: ⚠ Text extraction pending    │       │
│  │ [View] [Download] [Delete]           │       │
│  └──────────────────────────────────────┘       │
│                                                  │
│  No resumes yet? Upload your first resume       │
│  to start generating application packs.         │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Data source
Query the `resumes` table:
```typescript
const { data, error } = await supabase
  .from('resumes')
  .select('id, file_name, file_url, extracted_text, created_at, updated_at')
  .order('created_at', { ascending: false });
```

**`extracted_text` column** (added by Agent A in Phase 1):
- If not null → show "Text extracted" status
- If null → show "Text extraction pending" or "Extraction failed"

### Upload flow
Reuse the existing `fileUploadService.ts` for the upload button. After upload, refresh the list.

### Acceptance criteria
- [ ] ResumeBankPage shows all uploaded resumes
- [ ] Each resume card shows: filename, upload date, extraction status
- [ ] Upload button works and refreshes the list
- [ ] Delete button removes the resume (with confirmation dialog)
- [ ] Empty state message when no resumes exist
- [ ] Route added to `App.tsx`
- [ ] Navigation link added to sidebar/nav

---

## Task 2: Fix Capture Inbox Layout

### Problems
- Scroll issues — content overflows or is cut off on smaller viewports
- Action menus (per-opportunity) are cramped and hard to click
- The path from captured opportunity to pack generation is not obvious

### What to fix

**2a: Scroll fix**
- Ensure the opportunity list uses a scrollable container with `overflow-y: auto`
- The page header and filter bar should be sticky, not scroll with the list
- Test at 1024px and 1440px viewport widths

**2b: Action menu**
- Each opportunity card should have clearly spaced action buttons or a dropdown menu
- Minimum touch target: 44px × 44px
- Actions: "Open", "Generate Pack", "Edit", "Archive", "Delete"
- "Generate Pack" should link to ResumeTailorPage with the opportunity pre-loaded

**2c: "Generate Pack" path**
Add a prominent "Generate Pack" button/link on each opportunity card that navigates to:
```
/resume-tailor?applicationId={id}
```

ResumeTailorPage should read this query param and auto-load the opportunity.

### Acceptance criteria
- [ ] Opportunity list scrolls properly at 1024px and 1440px viewports
- [ ] Header/filter bar stays fixed while list scrolls
- [ ] Action buttons are clearly visible and have adequate touch targets
- [ ] "Generate Pack" action exists and navigates to ResumeTailorPage with the opportunity ID
- [ ] No horizontal overflow or layout breaking

---

## Task 3: ResumeTailor Page Sequence Clarity

### Problem
The user does not understand the sequence: load job → select resume → analyze → pack generated → review → download. The UI does not guide them through these steps.

### What to fix

Add a clear step indicator at the top of the page:

```
Step 1: Job Loaded    →    Step 2: Resume Selected    →    Step 3: Analyzing    →    Step 4: Review Pack    →    Step 5: Download
  ✓ Complete               ✓ Complete                      ● In Progress              ○ Pending                   ○ Pending
```

**Step behavior:**
1. **Job Loaded** — auto-completes when an opportunity is loaded (from Capture Inbox link or manual entry)
2. **Resume Selected** — user picks a resume from their Resume Bank. Show a dropdown of uploaded resumes with extraction status. Disable resumes that have no `extracted_text`.
3. **Analyzing** — shows when AI analysis/generation is running. Show a progress indicator with elapsed time.
4. **Review Pack** — shows the generated pack sections: cover letter, tailored resume preview, claims to verify, notes. Each section is expandable/collapsible.
5. **Download** — shows download buttons for DOCX and PDF. Both cover letter and tailored resume (when available).

### Pack review area
The pack review/download area must be visually prominent, not buried below the fold:

```
┌─────────────────────────────────────────────────┐
│  APPLICATION PACK — Senior Engineer at Acme     │
├─────────────────────────────────────────────────┤
│                                                  │
│  ▼ Cover Letter                                  │
│    [Preview text here...]                        │
│    [Download DOCX] [Download PDF]                │
│                                                  │
│  ▼ Tailored Resume                               │
│    [Preview text here... or "Not yet generated"] │
│    [Download DOCX] [Download PDF]                │
│                                                  │
│  ▼ Claims to Verify (3 items)                    │
│    ⚠ Verify every metric and date before sending │
│    ⚠ Confirm company name and role title         │
│    ⚠ Do not claim Python if not in resume        │
│                                                  │
│  ▼ Application Notes                             │
│    [Notes text here...]                          │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Resume dropdown integration
When the user selects a resume from the dropdown, the component should:
1. Fetch the resume's `extracted_text` from Supabase
2. Pass it as `cvText` to the AI service when the user clicks "Analyze"
3. Show the resume filename and extraction status in the step indicator

### Acceptance criteria
- [ ] Step indicator shows all 5 steps with current/completed/pending states
- [ ] Resume dropdown shows uploaded resumes with extraction status
- [ ] Resumes without extracted text are disabled in the dropdown
- [ ] Progress indicator shows during analysis with elapsed time
- [ ] Pack review area is immediately visible after generation completes
- [ ] Each pack section (cover letter, resume, claims, notes) is expandable
- [ ] Download buttons work for DOCX and PDF (cover letter at minimum)
- [ ] "Tailored Resume" section shows "Not yet generated" if the AI didn't produce one
- [ ] Claims to verify are always visible in red/warning styling

---

## Task 4: Clean Up Internal Information Leakage

### Problem
Some pages show internal information that end users should not see: provider names, model identifiers, cache status, internal task type labels.

### What to fix
Audit all pages and components for any display of:
- `metadata.provider` (e.g., "openrouter", "mock")
- `metadata.model` (e.g., "anthropic/claude-3.5-sonnet")
- `metadata.cached` (true/false)
- `taskType` labels (e.g., "analyzeCvMatch")
- Any internal error messages that reference infrastructure

Replace with user-friendly labels or remove entirely:
- "openrouter" → remove or show nothing
- "mock" → remove
- "cached: true" → remove
- "analyzeCvMatch" → "Match Analysis"
- Error messages → "Something went wrong. Please try again."

### Acceptance criteria
- [ ] No provider names, model IDs, or cache status visible in the UI
- [ ] No internal task type labels visible in the UI
- [ ] Error messages are user-friendly
- [ ] `pnpm --filter @jata/web build` passes

---

## Validation (run before committing)

```powershell
git diff --check
pnpm --filter @jata/web build
pnpm build
```

Visual testing:
- Open the dev server: `cd apps/web && pnpm dev`
- Check ResumeBankPage at `/resume-bank`
- Check CaptureInboxPage scroll and actions
- Check ResumeTailorPage step flow
- Test at 1024px and 1440px viewport widths
- Check for leaked internal labels

---

## Git Discipline

- Stage only files in your ownership list.
- Never stage `.env`, `.mcp.json`, `.claude/`, `node_modules/`, `dist/`.
- Commit message format: `feat(ui): <what changed>` or `fix(ui): <what changed>`
- Separate commits per task: Resume Bank, Capture Inbox, ResumeTailor, internal info cleanup.

---

## Report When Done

Provide:
1. Branch name
2. Commit hashes
3. Files changed (list)
4. Validation commands run and results
5. Screenshots or descriptions of the new/changed UI
6. Known limitations or visual issues

---

## Do NOT

- Do not touch `apps/web/src/services/documentExport/` (Agent D owns export logic)
- Do not touch `apps/web/src/services/aiService.ts` or `aiGateway.ts` (Agent D owns AI service)
- Do not touch `apps/extension/` (Agent B owns extension)
- Do not touch `supabase/` (backend)
- Do not touch `packages/common/` unless absolutely required and documented
- Do not add heavy UI libraries (keep bundle lean — no Material UI, no Chakra, no Ant Design)
- Do not redesign the entire application — fix the specific problems listed and/or make very minor UI changes if needed.
- Do not remove the dual status model (both legacy and canonical must work)
