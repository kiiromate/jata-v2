# Work Package F — Deterministic Scoring Engine

## Agent Role
Scoring/matching engineer responsible for building a deterministic pre-scoring layer, evidence-grounded skill matching, and improving the `analyzeCvMatch` AI prompt for verifiable output.

## Recommended Tool
**Codex** or **Claude Code** — this is a new module with a clear spec. Claude Code is preferred if you need web search for skill taxonomy research.

## Phase
**Phase 3** — Start only after Agents A (Data Foundation) and D (AI/Pack Quality) have merged to main. You depend on:
- `extracted_text` column in `resumes` table (Agent A)
- Stable `AiTaskType` definitions in `_shared/ai/types.ts` (Agent D)

## Branch
```
git checkout main && git pull
git checkout -b feature/scoring-engine
```

## MCP Tools Available (if using Claude Code)
- **brave-search** / **tavily** — Research skill taxonomies (ESCO, O*NET), NLP matching techniques
- **context7** — Library docs for any NLP packages considered
- **sequential-thinking** — Design the scoring algorithm before implementing

---

## Repo Context

JATA v2 is a job application system. When a user captures an opportunity and selects a resume, JATA should score the match quality before spending AI credits.

### What currently exists

**AI-based scoring only:** `analyzeCvMatch` in `supabase/functions/_shared/ai/types.ts` returns:
```typescript
interface AiMatchOutput {
  score: number;            // 0–100
  matchedSkills: string[];
  missingSkills: string[];
  suggestions: string[];
  atsScore?: number;
  atsIssues?: string[];
  safety: AiSafetySections;
}
```

This is fully AI-generated. It:
- Takes raw `cvText` and `jobDescription` as input
- Returns a score with no evidence citations
- May hallucinate skill matches (claims skills exist in CV when they don't)
- Costs an AI credit per call
- Is cached by input hash (so repeated calls are free after first)

**Capture confidence scoring:** `packages/common/src/extraction/confidence.ts` and `apps/extension/src/lib/captureConfidence.ts` — these score **extraction quality** (how well the job was captured from the page), NOT job-fit. These are separate systems. Do not conflate them.

### What is missing
1. No deterministic skill extraction (no regex/NLP/taxonomy-based system)
2. No evidence grounding (score cannot be traced to specific CV text)
3. No pre-AI scoring (user must spend an AI credit just to see a rough match)
4. No transferable skill mapping

---

## File Ownership (ONLY touch these files)

```
packages/common/src/scoring/            ← NEW directory — yours to create
supabase/functions/_shared/ai/content.ts ← analyzeCvMatch prompt section ONLY
```

**Do NOT touch:**
- `supabase/functions/_shared/ai/types.ts` (Agent D stabilized this — do not change output types)
- `supabase/functions/_shared/ai/executor.ts`, `router.ts`, `storage.ts`
- `apps/web/src/` (Agent E owns UI)
- `apps/extension/` (Agent B owns extension)
- `packages/common/src/extraction/` (capture pipeline, separate system)
- `supabase/migrations/` (no schema changes in this package)

---

## Task 1: Create Deterministic Skill Extractor

### What to build

Create `packages/common/src/scoring/skillExtractor.ts`

This module takes plain text (CV or JD) and returns a flat list of recognized skills.

### Approach: keyword-based with curated taxonomy

**Do NOT build a full NLP pipeline.** Use a curated skill list and case-insensitive matching.

```typescript
// packages/common/src/scoring/skillExtractor.ts

export interface ExtractedSkill {
  skill: string;        // normalized name: "python", "project management"
  source: string;       // the text span where it was found
  sourceIndex: number;  // character offset in the source text
}

export function extractSkills(text: string, taxonomy: string[]): ExtractedSkill[] {
  // Case-insensitive match of taxonomy terms against the text
  // Return all matches with their source spans
}
```

### Taxonomy

Create `packages/common/src/scoring/taxonomy.ts`

Start with a practical list of ~200-300 skills across common categories:

```typescript
export const SKILL_TAXONOMY: Record<string, string[]> = {
  programming: ['python', 'javascript', 'typescript', 'java', 'c#', 'c++', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', ...],
  frameworks: ['react', 'angular', 'vue', 'next.js', 'node.js', 'express', 'django', 'flask', 'spring boot', '.net', ...],
  data: ['sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'data analysis', 'machine learning', 'data science', ...],
  cloud: ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ci/cd', ...],
  soft_skills: ['project management', 'team leadership', 'communication', 'agile', 'scrum', 'stakeholder management', ...],
  design: ['figma', 'sketch', 'ui/ux', 'user research', 'wireframing', 'prototyping', ...],
  marketing: ['seo', 'sem', 'content marketing', 'social media', 'google analytics', 'copywriting', ...],
  finance: ['financial analysis', 'budgeting', 'forecasting', 'excel', 'financial modeling', ...],
  general: ['microsoft office', 'excel', 'powerpoint', 'communication', 'problem solving', 'critical thinking', ...],
};

export const FLAT_TAXONOMY: string[] = Object.values(SKILL_TAXONOMY).flat();
```

**Research task:** Use brave-search to find open skill datasets (ESCO, O*NET) and evaluate if any subset is worth incorporating. But start with a hand-curated list — it's faster and more reliable for MVP.

### Acceptance criteria
- [ ] `extractSkills(text, taxonomy)` returns all matched skills with source spans
- [ ] Matching is case-insensitive
- [ ] Multi-word skills match correctly ("project management", "machine learning")
- [ ] Taxonomy contains at least 200 skills across 5+ categories
- [ ] No false positives on common words (e.g., "go" should match as a programming language only in technical context — consider requiring word boundaries)
- [ ] Pure function, no side effects, no external dependencies
- [ ] Tests pass

---

## Task 2: Create Deterministic Match Scorer

### What to build

Create `packages/common/src/scoring/matchScorer.ts`

```typescript
export interface MatchResult {
  score: number;              // 0–100
  matchedSkills: string[];    // skills found in BOTH JD and CV
  missingSkills: string[];    // skills in JD but NOT in CV
  extraSkills: string[];      // skills in CV but NOT in JD
  evidenceMap: Record<string, { cvSpan: string; jdSpan: string }>;  // proof per matched skill
  label: 'strong' | 'moderate' | 'stretch' | 'low';
}

export function computeMatch(
  cvSkills: ExtractedSkill[],
  jdSkills: ExtractedSkill[],
): MatchResult {
  // Overlap-based scoring:
  // score = (matched / total_jd_skills) * 100
  // evidenceMap links each matched skill to its CV and JD source spans
}
```

### Score labels
| Range | Label | Meaning |
|-------|-------|---------|
| 80–100 | `strong` | Most requirements clearly met with evidence |
| 60–79 | `moderate` | Core fit present, some gaps |
| 40–59 | `stretch` | Significant gaps, application needs strong narrative |
| 0–39 | `low` | Major gaps |

### Evidence map
This is the most important part. For every matched skill, the scorer must record:
- `cvSpan`: the text fragment from the CV where the skill was found
- `jdSpan`: the text fragment from the JD where the skill appears

This makes the score **verifiable**. The UI (Agent E, future) can show: "We matched 'Python' because your CV says 'Python development for 3 years' and the job requires 'Python experience'."

### Acceptance criteria
- [ ] `computeMatch()` returns score, matched/missing/extra lists, and evidence map
- [ ] Score is `(matched / jdSkills) * 100` (or similar overlap metric)
- [ ] Every matched skill has evidence from both CV and JD
- [ ] Score label is correctly assigned based on range
- [ ] Pure function, no side effects
- [ ] Tests pass

---

## Task 3: Create Integration Entry Point

### What to build

Create `packages/common/src/scoring/index.ts`

```typescript
export { extractSkills, type ExtractedSkill } from './skillExtractor';
export { computeMatch, type MatchResult } from './matchScorer';
export { FLAT_TAXONOMY, SKILL_TAXONOMY } from './taxonomy';

export interface QuickScoreInput {
  cvText: string;
  jdText: string;
}

export interface QuickScoreOutput {
  match: MatchResult;
  cvSkillCount: number;
  jdSkillCount: number;
  timestamp: string;
}

export function quickScore(input: QuickScoreInput): QuickScoreOutput {
  const cvSkills = extractSkills(input.cvText, FLAT_TAXONOMY);
  const jdSkills = extractSkills(input.jdText, FLAT_TAXONOMY);
  return {
    match: computeMatch(cvSkills, jdSkills),
    cvSkillCount: cvSkills.length,
    jdSkillCount: jdSkills.length,
    timestamp: new Date().toISOString(),
  };
}
```

This gives the UI a single function to call: `quickScore({ cvText, jdText })` — no AI credit, instant result.

### Acceptance criteria
- [ ] `quickScore()` works end-to-end: text in, scored result out
- [ ] Takes under 50ms for typical CV + JD text lengths (under 12000 chars each)
- [ ] No external API calls — fully deterministic and local
- [ ] Exported from `packages/common/src/scoring/index.ts`

---

## Task 4: Write Tests

Create `packages/common/src/scoring/__tests__/scoring.test.ts` (or `.mjs` matching the project's test convention):

```typescript
// Test cases:
// 1. Known skill in both CV and JD → matched, with evidence spans
// 2. Skill in JD but not CV → shows in missingSkills
// 3. Skill in CV but not JD → shows in extraSkills
// 4. Empty CV → score 0, all JD skills missing
// 5. Identical CV and JD text → score 100
// 6. Case insensitivity: "Python" in CV, "python" in JD → matched
// 7. Multi-word skills: "project management" matches correctly
// 8. Word boundary: "go" should not match inside "going" or "cargo"
// 9. Performance: 10000-char CV + 5000-char JD completes under 50ms
```

### Acceptance criteria
- [ ] All 9 test cases pass
- [ ] Tests run with: `node --test packages/common/src/scoring/__tests__/scoring.test.ts`
- [ ] No test depends on external services or network access

---

## Task 5: Improve analyzeCvMatch Prompt for Evidence

### What to change

In `supabase/functions/_shared/ai/content.ts`, update the `analyzeCvMatch` prompt to:

1. Require the AI to cite specific CV text for each matched skill claim
2. Add a `matchEvidence` field to the expected output structure
3. Instruct the AI to use the deterministic skill list as a starting point (pass it in the prompt)

**Add to the prompt:**
```
For each skill you list in matchedSkills, you MUST include a "matchEvidence" entry showing:
- The exact phrase from the CV that supports this skill claim
- The exact phrase from the job description that requires this skill

If you cannot find a specific CV phrase to support a skill match, do NOT include that skill in matchedSkills. Move it to missingSkills instead.

The following skills were detected by automated pre-screening. Verify each one against the CV text:
[DETERMINISTIC_MATCHED_SKILLS]

The following skills appear in the job description but were not found in the CV by automated screening:
[DETERMINISTIC_MISSING_SKILLS]
```

**Important:** Do NOT change the `AiMatchOutput` type in `types.ts` (Agent D owns that). Instead, include the evidence in the prompt and let it flow through the `suggestions` field or the `safety.suggestedEdits` field of the existing output.

### Acceptance criteria
- [ ] `analyzeCvMatch` prompt now requires evidence citations
- [ ] Deterministic pre-screen results are passed to the AI as context
- [ ] AI output includes evidence in `suggestions` or a dedicated field
- [ ] No changes to `types.ts` output interfaces
- [ ] `pnpm build` passes

---

## Validation (run before committing)

```powershell
git diff --check
pnpm --filter @jata/web build
pnpm --filter @jata/extension build
pnpm build
node --test packages/common/src/scoring/__tests__/scoring.test.ts
```

---

## Git Discipline

- Stage only files in your ownership list.
- Never stage `.env`, `.mcp.json`, `.claude/`, `node_modules/`, `dist/`.
- Commit message format: `feat(scoring): <what changed>`
- Separate commits: taxonomy, skill extractor, match scorer, integration, tests, prompt improvement.

---

## Report When Done

Provide:
1. Branch name
2. Commit hashes
3. Files changed (list)
4. Validation commands run and results
5. Test results
6. Sample `quickScore()` output for a real-ish CV + JD pair
7. Taxonomy size (number of skills)
8. Performance measurement (time for typical input)

---

## Do NOT

- Do not modify `supabase/functions/_shared/ai/types.ts` (Agent D owns types)
- Do not modify `supabase/functions/_shared/ai/executor.ts`, `router.ts`, `storage.ts`
- Do not create new Edge Functions
- Do not create new migrations
- Do not touch `apps/web/` pages or components (Agent E owns UI)
- Do not touch `apps/extension/` (Agent B owns extension)
- Do not touch `packages/common/src/extraction/` (capture confidence is a separate system)
- Do not add heavyweight NLP libraries (no spaCy, no NLTK, no TensorFlow — pure TypeScript only)
- Do not build a skill taxonomy API service — keep it as a static module
- Do not inflate scores — honest scoring is a core product principle
- Do not change the `AiMatchOutput` interface or `AiTaskType` string values
