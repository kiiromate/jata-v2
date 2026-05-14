# Work Package D — AI Pack Quality & Structured Resume Output

## Agent Role
AI/backend engineer responsible for bridging the text-to-structured-data gap in tailored resume generation, fixing cover letter completeness, and wiring resume text extraction into AI inputs.

## Recommended Tool
**Claude Code** (requires Supabase MCP for Edge Function deployment, has jata-ai-gateway and jata-document-generation skills).

## Phase
**Phase 2** — Start only after Agent A (Data Foundation) has merged to main. You depend on the `extracted_text` column in the `resumes` table and the enriched opportunity fields.

## Branch
```
git checkout main && git pull
git checkout -b feature/ai-pack-quality
```

## MCP Tools Available
- **Supabase MCP** — `deploy_edge_function`, `execute_sql`, `get_logs`
- **brave-search** / **tavily** — Research structured output patterns for LLM resume generation
- **context7** — Package docs for `docx`, `jspdf` libraries
- **sequential-thinking** — For planning prompt architecture changes

---

## Repo Context

JATA v2 is a job application system with a multi-provider AI gateway.

### AI Gateway Architecture (your primary work area)
```
supabase/functions/_shared/ai/
  types.ts        ← Task type definitions, input/output interfaces
  router.ts       ← Provider resolution (openrouter → huggingface → mock)
  executor.ts     ← executeAiTask() — cache, limits, safety, logging
  content.ts      ← buildPrompt() — prompt templates for each task
  hash.ts         ← Input hashing for cache
  storage.ts      ← ai_outputs table access, credit system
  providers/
    openRouterProvider.ts
    huggingfaceProvider.ts
    mockProvider.ts
    noAiProvider.ts
```

### Document Export Architecture (secondary work area)
```
apps/web/src/services/documentExport/
  types.ts                        ← ApplicationPackDocument, TailoredResumeContent, TailoredResumeStructured
  buildApplicationPackDocument.ts ← buildCoverLetterDocument(), buildResumeDocument()
  clientDocxExporter.ts           ← exportCoverLetterDocx(), exportResumeDocx()
  clientPdfExporter.ts            ← exportCoverLetterPdf(), exportResumePdf()
  filename.ts                     ← Naming conventions
  index.ts                        ← Re-exports
```

### The Critical Gap You Must Fix

**`generateTailoredResume` in `types.ts` returns `AiTextOutput` (plain text string + safety sections). But the DOCX/PDF exporters require `TailoredResumeContent`, which contains `TailoredResumeStructured`:**

```typescript
interface TailoredResumeStructured {
  summary: string;
  skills: string[];
  experience: TailoredResumeExperience[];
  education: Array<{ degree: string; institution: string; dates: string }>;
  projects_or_additional: string[];
  claimsToVerify: string[];
}
```

The AI generates text, but the exporter needs JSON. This gap means no tailored resume DOCX/PDF can be produced end-to-end.

### AI Task Types (all 7)
| Task | Returns |
|------|---------|
| `analyzeCvMatch` | `AiMatchOutput` (score, matchedSkills, missingSkills, atsScore) |
| `generateCoverLetter` | `AiTextOutput` (content string) |
| `generateTailoredResume` | `AiTextOutput` ← **THIS IS THE PROBLEM** |
| `suggestResumeImprovements` | `AiTextOutput` |
| `generateRecruiterMessage` | `AiTextOutput` |
| `generateFollowUpMessage` | `AiTextOutput` |
| `summarizeOpportunity` | `AiTextOutput` |

### Provider Modes
- `openrouter` — primary (requires `OPENROUTER_API_KEY` + `JATA_AI_MODEL_DEFAULT`)
- `huggingface` — alternative (requires `HUGGINGFACE_API_KEY`)
- `mock` — deterministic stubs for testing
- `none` — blocked/empty responses

### Pack Workflow (deterministic, non-AI)
`packages/common/src/packWorkflow.ts` — `buildApplicationPackWorkflow()` produces template-based cover letter, shortIntro, customQuestionAnswers, recruiterMessage, followUpMessage, notes. This is separate from AI generation and should not be broken.

---

## File Ownership (ONLY touch these files)

```
supabase/functions/_shared/ai/         ← All files (types, content, executor, providers)
supabase/functions/ai-generate/        ← The Edge Function entry point
apps/web/src/services/documentExport/  ← Export types and builders
apps/web/src/services/aiService.ts     ← Client-side AI service
apps/web/src/services/aiGateway.ts     ← Client-side AI gateway
packages/common/src/packWorkflow.ts    ← Pack workflow contract
```

**Do NOT touch:** `apps/web/src/pages/`, `apps/web/src/components/`, `apps/extension/`, `supabase/migrations/`, `packages/common/src/extraction/`, `packages/common/src/scoring/`.

---

## Task 1: Make generateTailoredResume Return Structured Output

### What to change

**Option A (recommended): Change the output type for `generateTailoredResume`**

In `types.ts`, create a new output type:

```typescript
export interface AiTailoredResumeOutput {
  structured: TailoredResumeStructured;
  markdown: string;
  safety: AiSafetySections;
}
```

Update `AiTaskOutputMap`:
```typescript
export interface AiTaskOutputMap {
  // ... existing entries ...
  generateTailoredResume: AiTailoredResumeOutput;  // was AiTextOutput
}
```

**You will need to import `TailoredResumeStructured` from the web app's types or duplicate the interface in the shared AI types.** Preferred: move the type definitions to `packages/common/` so both the Edge Function and the web app can import them.

### Update content.ts prompt

The `buildPrompt()` function for `generateTailoredResume` must instruct the LLM to return structured JSON, not prose:

```
You are a professional resume writer. Given the candidate's CV and the target job description, produce a tailored resume as JSON.

Return ONLY valid JSON matching this exact structure:
{
  "summary": "2-3 sentence professional summary tailored to the role",
  "skills": ["skill1", "skill2", ...],
  "experience": [
    {
      "role": "Job Title",
      "company": "Company Name",
      "location": "City, Country",
      "dates": "Month Year – Month Year",
      "bullets": ["Achievement 1", "Achievement 2"]
    }
  ],
  "education": [
    { "degree": "Degree Name", "institution": "University", "dates": "Year – Year" }
  ],
  "projects_or_additional": ["Item 1", "Item 2"],
  "claimsToVerify": ["Any claim that needs human verification"]
}

RULES:
- ONLY include experience, skills, and education that appear in the candidate's CV.
- Do NOT invent roles, companies, metrics, credentials, or dates.
- Rewrite bullets to emphasize relevance to the target job, but keep them factually grounded.
- claimsToVerify must list anything you rephrased that might misrepresent the original.
- If the CV lacks a section (e.g., no education listed), return an empty array.
```

### Update each provider

Each provider's `generateTailoredResume` method must:
1. Send the structured-output prompt
2. Parse the JSON response
3. Validate the structure (at minimum: `summary` is string, `experience` is array)
4. Return `AiTailoredResumeOutput` instead of `AiTextOutput`

For the `mock` provider: return a hardcoded valid `AiTailoredResumeOutput` for testing.

### Update executor.ts

The `ensureOutputSafety` function needs to handle the new output type. Add a case for `generateTailoredResume` that validates the structured fields and ensures `claimsToVerify` is populated.

### Acceptance criteria
- [ ] `generateTailoredResume` returns `AiTailoredResumeOutput` with valid `structured` field
- [ ] Mock provider returns a complete, valid structured resume
- [ ] OpenRouter provider sends structured-output prompt and parses JSON response
- [ ] JSON parse failures are caught and logged as `failed` in `ai_outputs`
- [ ] `claimsToVerify` is always populated (never empty)
- [ ] Existing `AiTextOutput` tasks (cover letter, etc.) are unchanged
- [ ] `pnpm build` passes

---

## Task 2: Wire Resume Text Into AI Inputs

### Problem
Agent A (Phase 1) added `extracted_text` to the `resumes` table. Now the AI tasks need to use it.

### What to change
In `supabase/functions/ai-generate/index.ts` (or wherever AI task inputs are assembled):

1. When the request includes a `resumeId`, fetch the resume's `extracted_text` from the `resumes` table.
2. Pass `extracted_text` as the `cvText` field in the AI task input.
3. If `extracted_text` is null (extraction failed), fall back to any `cvText` provided in the request body.

### Acceptance criteria
- [ ] AI tasks receive the full resume text from the `resumes` table when a `resumeId` is provided
- [ ] Fallback to request-body `cvText` when no `resumeId` or when `extracted_text` is null
- [ ] No change to the AI task signatures — this is input assembly, not type changes

---

## Task 3: Fix Cover Letter Completeness

### Problem
Generated cover letters in testing were incomplete and unusable. The deterministic template in `packWorkflow.ts` produces a thin skeleton. The AI-generated cover letter (`generateCoverLetter` task) needs better prompting.

### What to change
In `content.ts`, improve the `generateCoverLetter` prompt to:

1. Require a complete, ready-to-send cover letter (not a template or outline)
2. Use specific evidence from the CV text and job description
3. Include proper opening, body paragraphs, and closing
4. Maintain a professional tone (use the `tone` parameter from `GenerateCoverLetterInput`)
5. Not exceed 400 words
6. Not invent experience, credentials, or metrics not in the CV

### Acceptance criteria
- [ ] Generated cover letter is complete (greeting, 2-3 body paragraphs, closing, sign-off)
- [ ] Cover letter references specific skills/experience from the CV text
- [ ] Cover letter references specific requirements from the job description
- [ ] `claimsToVerifyBeforeSending` in the safety output flags any embellished claims
- [ ] Cover letter is under 400 words
- [ ] `pnpm build` passes

---

## Task 4: Deploy Updated Edge Functions

After all changes:

```powershell
# Deploy ai-generate with updated logic
supabase functions deploy ai-generate

# Verify deployment
supabase functions list
```

Or use the Supabase MCP `deploy_edge_function` tool.

### Acceptance criteria
- [ ] `ai-generate` Edge Function deployed successfully
- [ ] Test a mock provider call via the API to verify the function responds
- [ ] No regression on existing AI task types

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

- Stage only files in your ownership list.
- Never stage `.env`, `.mcp.json`, `.claude/`, `node_modules/`, `dist/`.
- Commit message format: `feat(ai): <what changed>`
- Separate commits: structured resume output, resume text wiring, cover letter prompt, Edge Function deploy.

---

## Report When Done

Provide:
1. Branch name
2. Commit hashes
3. Files changed (list)
4. Validation commands run and results
5. Edge Function deployment status
6. Sample mock provider output for `generateTailoredResume` (paste the JSON)
7. Any issues or limitations

---

## Do NOT

- Do not touch `apps/web/src/pages/` or `apps/web/src/components/` (Agent E owns UI)
- Do not touch `apps/extension/` (Agent B owns extension)
- Do not create new migrations (coordinate with Agent A if schema changes needed)
- Do not touch `packages/common/src/extraction/` (capture pipeline)
- Do not touch `packages/common/src/scoring/` (Agent F owns scoring)
- Do not change the `AiProviderMode` enum values
- Do not change the `AiTaskType` string literals for existing tasks (they're stored in `ai_outputs.task_type`)
- Do not increase rate limits without documenting cost implications
- Do not store raw prompt text in ai_outputs — only hashes and char counts
- Do not expose `metadata.provider` or `metadata.model` in user-facing output
