# Capture Extraction Architecture

## Overview

Every capture channel (extension, Quick Capture, PWA share, Telegram) normalises its payload through a shared extraction pipeline before it reaches Capture Inbox. This ensures a single confidence signal, consistent field names, and a clear path to repair.

## Extraction Cascade

Low-cost-first order:

1. Extension visible DOM extraction
2. JSON-LD / schema.org extraction
3. Open Graph / meta extraction
4. Known job-board adapters (Greenhouse, Lever, Ashby, Workday, SmartRecruiters)
5. Generic job-page adapter (URL path heuristic)
6. Generic opportunity adapter (final fallback — grants, fellowships, other)
7. *(future)* Server-side fetch parsing
8. *(future)* Local Playwright QA/fallback
9. *(future)* Apify/Crawlee capture repair

## Adapter Registry

Location: `packages/common/src/extraction/adapters/`

Each adapter implements `ExtractionAdapter`:

```ts
interface ExtractionAdapter {
  id: string;
  label: string;
  detect(url: string): boolean;
  normalize(context: ExtractionContext): Partial<ExtractionResult>;
  confidence(result: Partial<ExtractionResult>): number;
}
```

Registry order matters — most specific adapters first; `genericOpportunity` is always last because its `detect()` returns `true` unconditionally.

Current adapters (in registry order):

| Adapter | ID | Matches |
|---|---|---|
| Greenhouse | `greenhouse` | `greenhouse.io`, `boards.greenhouse.io` |
| Lever | `lever` | `lever.co` |
| Ashby | `ashby` | `ashbyhq.com`, `jobs.ashby.io` |
| Workday | `workday` | `myworkdayjobs.com` |
| SmartRecruiters | `smart_recruiters` | `smartrecruiters.com` |
| Generic Job Page | `generic_job_page` | `/jobs/`, `/careers/`, known boards |
| Generic Opportunity | `generic_opportunity` | everything else |

## Confidence Scoring

Location: `packages/common/src/extraction/confidence.ts`

Weighted sum of present fields, capped to [0, 1]:

| Field | Weight |
|---|---|
| title | 0.25 |
| company | 0.20 |
| sourceUrl | 0.13 |
| description (≥200 chars) | 0.15 |
| applyUrl | 0.08 |
| location | 0.07 |
| requirements OR responsibilities | 0.05 |
| deadline | 0.02 |
| adapter match (known board) | 0.03 |
| JSON-LD signals present | 0.02 |

Thresholds:

| Score | Label | Action |
|---|---|---|
| ≥ 0.80 | `strong` | Auto-proceed to Capture Inbox |
| 0.55 – 0.79 | `review_recommended` | Flag for user review |
| < 0.55 | `weak` | Prominent review prompt; offer repair |

## Normalised Extraction Output

```ts
interface ExtractionResult {
  title: string | null
  company: string | null
  location: string | null
  description: string | null
  requirements: string[]
  responsibilities: string[]
  employmentType: string | null
  deadline: string | null
  applyUrl: string | null
  sourceUrl: string
  sourceHost: string
  sourceType: string
  extractionMethod: string
  adapterId: string
  confidenceScore: number
  missingFields: string[]
  warnings: string[]
  requiresReview: boolean
  rawSignals?: Record<string, unknown>
}
```

## Confidence in Capture Payload

Confidence metadata flows through `parsedPayload.metadata` — no DB migration required because `CaptureMetadata = Record<string, Json | undefined>`.

Fields stored:

- `confidenceScore` — number 0–1
- `confidenceLabel` — `'strong' | 'review_recommended' | 'weak'`
- `missingFields` — string[]
- `warnings` — string[]
- `requiresReview` — boolean
- `adapterId` — string
- `extractionMethod` — string

## Extension Integration

The extension uses a self-contained scorer at `apps/extension/src/lib/captureConfidence.ts`. It does **not** import `@jata/common` — the extension has no workspace dependency on the common package and its tsconfig only includes `src/`. The scorer is a standalone copy with weights adapted for the fields available at extension capture time (URL serves as both sourceUrl and applyUrl, combined weight 0.21).

`captureInboxClient.ts` calls `computeCaptureConfidence()` inside `buildCaptureInboxBody()` and injects the result into `parsed.metadata`.

## Capture Inbox UI

`CaptureQueueTable` displays a **Confidence** column between Parse and Score, reading `item.parsedPayload?.metadata?.confidenceLabel`.

`CaptureStatusBadges` exports `ConfidenceBadge`:

- `strong` → green (offer style)
- `review_recommended` → amber (interview style)
- `weak` → red (rejected style)

## Capture Repair Interface

Location: `packages/common/src/extraction/repair.ts`

Stub only — no external provider is wired. Future providers implement `CaptureRepairProvider`:

```ts
interface CaptureRepairProvider {
  type: CaptureRepairProviderType;
  repair(job: CaptureRepairJob): Promise<Partial<ExtractionResult>>;
}
```

Statuses: `not_configured | queued | running | completed | failed`

Repair flow (future):
1. User clicks Repair in Capture Inbox.
2. Edge Function creates a `CaptureRepairJob`.
3. Provider extracts deeper.
4. Result returns to Capture Inbox.
5. User approves / edits / rejects before any application is created.

Planned providers: `local`, `apify`, `crawlee`, `playwright`.

## Boundaries

**Never** in this layer:
- Auto-apply
- Hidden form submission
- Credential harvesting
- Anti-bot bypass
- Production Apify/Crawlee/Playwright without explicit user repair trigger
