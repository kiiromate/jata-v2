# JATA Multi-Agent Architecture

This document defines the specialized agent roles required to maintain and evolve JATA V2 autonomously.

## 1. Agent Roles & Responsibilities

### 🏗️ Build & Release Agent (`build-agent`)
**Responsibility:** Ensures the codebase builds, tests pass, and deployments succeed.
- **Tools:** `pnpm`, `turbo`, `vercel`, `gh` (GitHub CLI).
- **Triggers:** On every PR open, on merge to main.
- **Tasks:**
  - Run `pnpm lint` and `pnpm test`.
  - Check bundle size regressions.
  - Manage Vercel preview deployments.

### 🧪 QA & Test Agent (`test-agent`)
**Responsibility:** Maintains quality gates and writes regression tests.
- **Tools:** `playwright`, `vitest`, `axe-core`.
- **Tasks:**
  - Write missing unit tests for new utils.
  - Run E2E flows (Sign in -> Scrape Job -> Dashboard).
  - Verify accessibility compliance.

### 🚀 Deploy & Ops Agent (`deploy-agent`)
**Responsibility:** Manages infrastructure, environment variables, and release channels.
- **Tools:** `supabase` CLI, `vercel` CLI, `sentry-cli`.
- **Tasks:**
  - Apply Supabase migrations (`supabase db push`).
  - Sync environment variables across Vercel and GitHub Actions.
  - Monitor Sentry for new release errors.

### 🧠 Optimization Agent (`opt-agent`)
**Responsibility:** Continuously improves performance and cost.
- **Tools:** `lighthouse`, `bundle-visualizer`.
- **Tasks:**
  - Analyze split chunks and suggest lazy loading.
  - Monitor Edge Function execution time and cost.
  - Suggest caching strategies for AI responses.

## 2. Agent Communication Protocol

Agents communicate via **GitHub Issues** and **PR Comments** using structured tags:

- **Request:** `[AGENT-REQ] <AgentName>: <Task Description>`
- **Status:** `[AGENT-STATUS] <JobID>: <Running|Success|Failed>`
- **Handoff:** `[AGENT-HANDOFF] Handing over to @deploy-agent for migration application.`

## 3. Configuration Templates

### Environment Variables Checklist (Secrets)
Every agent needs access to these secrets (injected via CI/CD or `.env`):

```bash
# Core
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...  # For admin tasks (deploy-agent only)
SUPABASE_ACCESS_TOKEN=...      # For CLI ops

# AI
VITE_HUGGING_FACE_API_KEY=...

# Deployment
VERCEL_TOKEN=...
VERCEL_ORG_ID=...
VERCEL_PROJECT_ID=...
GITHUB_TOKEN=...               # For PR comments and checks

# Monitoring
SENTRY_AUTH_TOKEN=...
```

### Agent Tooling Config (`.agentrc.json`)

```json
{
  "project": "jata-v2",
  "monorepo": true,
  "packageManager": "pnpm",
  "agents": {
    "build-agent": {
      "frameworks": ["vite", "react"],
      "commands": {
        "build": "turbo build",
        "lint": "turbo lint"
      }
    },
    "deploy-agent": {
      "platform": "vercel",
      "db": "supabase",
      "migrationsDir": "supabase/migrations"
    }
  }
}
```
