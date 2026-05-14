# JATA Multi-Agent Orchestration Guide

## Goal

Turn JATA into a working SOTA job application system: fast capture, accurate ATS-proof documents, form autofill assistance, and pipeline tracking. Ship it by dividing work across concurrent coding agents that do not collide.

## Agent Assignments

| Work Package | Agent Role | Recommended Tool | Phase | Branch |
|---|---|---|---|---|
| A — Data Foundation | Resume parsing, schema enrichment | **Claude Code** (needs Supabase MCP) | 1 | `feature/data-foundation` |
| B — Extension | Pick flow fix, pack trigger | **Gemini CLI** or **Claude Code** | 1 | `fix/extension-pick-flow` |
| C — QA / Security | Live RLS smoke test, gate closure | **Claude Code** (needs Supabase MCP) | 1 | `test/security-gate-closure` |
| D — AI / Pack | Structured resume output, cover letter fix | **Claude Code** (needs Edge Function deploy) | 2 | `feature/ai-pack-quality` |
| E — UI / UX | Resume bank, Capture Inbox, ResumeTailor | **Codex** or **Antigravity** | 2 | `feature/ui-ux-overhaul` |
| F — Scoring | Deterministic pre-scoring, evidence grounding | **Codex** or **Claude Code** | 3 | `feature/scoring-engine` |

## Why These Assignments

- **Claude Code** gets anything that touches Supabase Edge Functions, migrations, security, or the AI gateway. It has the Supabase MCP, Chrome DevTools MCP, JATA skills, and CLAUDE.md context.
- **Gemini CLI** gets the extension work — it has strong web search for Manifest V3 docs and Chrome API references. Claude Code is the fallback if Gemini struggles with the extension messaging patterns.
- **Codex / Antigravity** get the UI/UX and scoring work — these are well-scoped React component tasks with clear specs that don't need backend MCP access.

## Execution Flow

```
PHASE 1 (parallel — start all three simultaneously)
├── Agent A: Data Foundation ──────┐
├── Agent B: Extension ────────────┤ No file overlap. All can run at once.
└── Agent C: QA / Security ────────┘
         │
         ▼ (merge all three PRs to main)
         │
PHASE 2 (parallel — start both after Phase 1 merges)
├── Agent D: AI / Pack ────────────┐ D owns backend + export.
└── Agent E: UI / UX ─────────────┘ E owns pages + components.
         │
         ▼ (merge both PRs to main)
         │
PHASE 3 (sequential)
└── Agent F: Scoring ──────────────  New module, builds on Phase 1+2.
```

## Setup: Git Worktrees

Use git worktrees so each agent has its own working directory without branch-switching conflicts.

```powershell
# From the main repo directory
cd "C:\Users\PC\Documents\My journey\Build Projects\Gemini-cli\jata_build\jata_v2"

# Phase 1 — create three worktrees
git worktree add ../jata-agent-a feature/data-foundation
git worktree add ../jata-agent-b fix/extension-pick-flow
git worktree add ../jata-agent-c test/security-gate-closure

# Point each agent's terminal/IDE to its worktree:
# Agent A → ../jata-agent-a
# Agent B → ../jata-agent-b
# Agent C → ../jata-agent-c
```

After Phase 1 PRs merge:

```powershell
# Clean up Phase 1 worktrees
git worktree remove ../jata-agent-a
git worktree remove ../jata-agent-b
git worktree remove ../jata-agent-c

# Pull updated main
git checkout main && git pull

# Phase 2 — create two worktrees
git worktree add ../jata-agent-d feature/ai-pack-quality
git worktree add ../jata-agent-e feature/ui-ux-overhaul
```

Same pattern for Phase 3.

## Merge Protocol

1. Each agent opens a PR against `main` when done.
2. Review the PR diff — verify file ownership boundaries were respected.
3. Run the full validation suite before merging:
   ```powershell
   pnpm --filter @jata/web build
   pnpm --filter @jata/extension build
   pnpm build
   node --test scripts/security-rls.test.mjs
   node --test scripts/data-durability.test.mjs
   ```
4. Merge to `main` using squash-merge (keeps history clean).
5. Delete the feature branch after merge.
6. Next-phase agents must create their branches FROM the updated `main`.

## File Ownership Map (collision prevention)

```
Agent A OWNS:
  supabase/functions/upload-resume/
  supabase/functions/resumes-create/
  supabase/migrations/*_data_foundation*.sql  (new only)
  packages/common/src/database.types.ts  (regenerated)

Agent B OWNS:
  apps/extension/src/  (entire directory)

Agent C OWNS:
  scripts/  (new test files only)
  docs/  (test result documentation only)

Agent D OWNS:
  supabase/functions/_shared/ai/  (all files)
  supabase/functions/ai-generate/
  apps/web/src/services/documentExport/
  apps/web/src/services/aiService.ts
  apps/web/src/services/aiGateway.ts
  packages/common/src/packWorkflow.ts

Agent E OWNS:
  apps/web/src/pages/
  apps/web/src/components/
  apps/web/src/styles/
  apps/web/src/App.tsx  (routing only)

Agent F OWNS:
  packages/common/src/scoring/  (new directory)
  supabase/functions/_shared/ai/content.ts  (analyzeCvMatch prompt section only)
```

**Rule: If an agent needs to touch a file outside its ownership, it stops and documents the request. It does not make the change.**

## How to Paste Prompts

Each work package file (01 through 06) is a self-contained prompt. To use:

1. Open the file for the agent you want to start.
2. Copy the entire contents.
3. Paste it as the first message in a new session of the assigned tool (Claude Code, Codex, Gemini CLI, etc.).
4. The agent has everything it needs — no additional context required.

For Claude Code agents: the CLAUDE.md and skills in the repo will supplement the prompt automatically. For other agents (Codex, Gemini, Antigravity): the prompt is fully self-contained and includes all necessary repo context.

## Monitoring Progress

Track each agent's status:

| Agent | Status | Branch | PR | Notes |
|---|---|---|---|---|
| A | Not started | `feature/data-foundation` | | |
| B | Not started | `fix/extension-pick-flow` | | |
| C | Not started | `test/security-gate-closure` | | |
| D | Blocked on Phase 1 | `feature/ai-pack-quality` | | |
| E | Blocked on Phase 1 | `feature/ui-ux-overhaul` | | |
| F | Blocked on Phase 2 | `feature/scoring-engine` | | |

Update this table as agents complete their work.

## Emergency: Agent Crosses File Boundary

If an agent produces a diff that touches files it does not own:

1. Do NOT merge the PR.
2. Check if the change is actually necessary or if the agent over-reached.
3. If necessary: extract the boundary-crossing change into a separate commit, apply it first, let the owning agent review.
4. If not necessary: ask the agent to revert those files and re-submit.

## Emergency: Migration Conflict

Only Agent A writes migrations in Phase 1. If Phase 2 or 3 agents need schema changes:

1. Create the migration in a separate PR.
2. Merge it to `main` first.
3. Then rebase the agent's branch onto updated `main`.
4. Never have two agents writing migrations simultaneously.
