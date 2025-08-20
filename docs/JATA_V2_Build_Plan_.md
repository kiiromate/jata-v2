**Project**: JATA (Job Application Tracker & Optimization App)  
**Version**: 2.0  
**Date**: July 24, 2025  
**Purpose**: Streamline job applications with a browser extension, tracking dashboard, and AI-driven resume optimization, using free, agentic tools to minimize manual effort.

## Overview

JATA V2 empowers job seekers with a browser extension for scraping job details, a dashboard for tracking applications, and AI-powered resume tailoring. This plan leverages Windsurf IDE, Supabase, and other free tools to automate development, ensuring accessibility (WCAG 2.1 AA), privacy (local/encrypted data), and zero-budget constraints.

## Technical Constraints

- **Budget**: Free-tier tools only.
- **Privacy**: Local processing or encrypted storage for sensitive data (e.g., resumes).
- **Compatibility**: Chrome, Firefox, Edge via WebExtensions API; major job boards.
- **Performance**: API responses <100ms, frontend bundle <200KB.

## Technology Stack

|Component|Tools/Frameworks|
|---|---|
|**Frontend**|React 18, Vite 5, Tailwind CSS 3, Zustand, TanStack Query, React Router|
|**Backend**|Supabase (PostgreSQL, Edge Functions, Auth)|
|**Extension**|WebExtension MV3, TypeScript, React|
|**AI**|Hugging Face API (free tier)|
|**Testing**|Jest, Playwright, axe-core|
|**CI/CD**|GitHub Actions, Netlify|
|**Agentic Tools**|Windsurf IDE, Gemini CLI, Cursor, Codeium|

## Current Status (Phase 0 Completed)

- **Monorepo**: `apps/web`, `apps/api`, `apps/extension`, `packages/ui` set up with Vite, TypeScript, and Tailwind.
- **Deploy**: `apps/web` draft on Netlify.
- **Docs**: In `docs/` on GitHub (`jata-v2`).
- **Backend**: Supabase project created with authentication (email + GitHub).

## Build Plan

### Phase 1: Backend Setup with Supabase (Completed)

- **Status**: Supabase project set up with email and GitHub authentication.
- **Next**: Generate schema and functions in Phase 2.

### Phase 2: Backend Schema & Functions (45 min)

**Goal**: Automate database schema and serverless functions.

#### Steps

1. **Generate Schema**
    
    - Use Windsurf IDE (Cascade): “Generate a PostgreSQL schema for a job tracker with tables: applications (id: number, title: string, company: string, status: string, dateApplied: string, url: string, source: string, industry: string, userId: number), users (id: number, email: string, name: string), scrape_configs (id: number, domain: string, field: string, selector: string, userId: number). Include indexes on `userId` and `status` in the `applications` table. Save as `apps/api/schema.sql`.”
    - Paste into Supabase SQL Editor and execute.
2. **Generate Edge Functions**
    
    - Use Windsurf: “Generate TypeScript Supabase Edge Functions for CRUD on applications (POST/GET/PATCH/DELETE /api/applications) in `apps/api/functions/`. Use `@supabase/supabase-js`, handle authentication with Supabase’s auth helpers (e.g., `supabase.auth.getUser()`), and filter by the authenticated user’s ID.”
    - Deploy via Supabase dashboard.
3. **Test Functions**
    
    - Use Gemini CLI: “Generate Jest tests for Edge Functions in `apps/api/tests/`, including authentication and authorization scenarios.”
    - Run: `pnpm --filter @jata/api test`.
4. **Commit**
    
    ```bash
    git add apps/api
    git commit -m "Add Supabase schema and CRUD functions with authentication"
    git push
    ```
    

### Phase 3: Frontend Dashboard (60 min)

**Goal**: Generate a responsive dashboard integrated with Supabase.

#### Steps

1. **Generate UI**  
    **Generate UI**
    
    - Use Windsurf: “Generate a React + TypeScript + Tailwind dashboard in `apps/web/src/pages/Dashboard.tsx` with a job table (title, company, status, dateApplied), filters (All, Applied, Interview, Offer), modal for adding jobs, and dark/light mode toggle. Use JATA colors (Cool Gray #D3D7D9, Soft Olive #A3BFFA, Charcoal Gray #4A4A4A, Jet Black #1C2526, Light Gray #E5E7EB). Ensure WCAG 2.1 AA compliance.”
    - Copy to `apps/web/src/pages`.
2. **Integrate Supabase**
    
    - Install client: `pnpm --filter @jata/web add @supabase/supabase-js @tanSTACK/react-query zustand`.
    - Use Codeium: “Add Supabase client logic with TanStack Query to fetch/update applications in `Dashboard.tsx`, using Zustand for filter/modal state. Include error handling with try-catch blocks and loading states using TanStack Query’s `isLoading` and `error` properties.”
    - **Note**: Consider adding a bulk upload component if part of the MVP: "Include a bulk upload component for CSV or folder uploads."
3. **Refine Accessibility**
    
    - Use Cursor: “Add ARIA labels and keyboard navigation to `Dashboard.tsx`.”
    - Install axe-core: `pnpm --filter @jata/web add axe-core`.
    - Run: `pnpm --filter @jata/web lint:a11y`.
4. **Deploy**
    
    - Build: `pnpm --filter @jata/web build`.
    - Deploy: `netlify deploy --prod`.
    - Commit: `git add apps/web && git commit -m "Add dashboard with Supabase integration and error handling" && git push`.

### Phase 4: Browser Extension (45 min)

**Goal**: Build an extension for job scraping and data submission.

#### Steps

1. **Generate Extension**
    
    - Use Windsurf: “Generate a WebExtension MV3 in TypeScript with `manifest.json`, content scripts for job scraping (interactive element selection), and a React popup in `apps/extension/src/`. Integrate with Supabase for data storage.”
    - Copy to `apps/extension`.
2. **Refine Popup**
    
    - Use Cursor: “Enhance `apps/extension/src/popup.tsx` with Tailwind and accessibility.”
3. **Test**
    
    - Use Gemini CLI: “Generate Jest tests for extension scripts in `apps/extension/tests/`.”
    - Run: `pnpm --filter @jata/extension test`.
    - **Cross-Browser Testing**: Test in Chrome, Firefox, and Edge using Playwright or manual loading.
4. **Commit**
    
    ```bash
    git add apps/extension
    git commit -m "Add browser extension with scraping and popup"
    git push
    ```
    

### Phase 5: AI Resume Tailoring (30 min)

**Goal**: Add an AI module for resume optimization.

#### Steps

1. **Generate AI Module**
    
    - **API Verification**: Research and select a suitable model (e.g., `distilbert-base-uncased` for keyword extraction).
    - Use Windsurf: “Generate a TypeScript module in `apps/web/src/ai/` to extract keywords from job descriptions and tailor resumes using Hugging Face API (free tier, model: `distilbert-base-uncased`). Integrate with `Dashboard.tsx`.”
    - Copy to `apps/web/src/ai`.
2. **Test**
    
    - Use Gemini CLI: “Generate Jest tests for AI module in `apps/web/tests/ai/`.”
    - Run: `pnpm --filter @jata/web test`.
3. **Commit**
    
    ```bash
    git add apps/web
    git commit -m "Add AI resume tailoring module"
    git push
    ```
    

### Phase 6: Testing & QA (30 min)

**Goal**: Ensure quality and accessibility.

#### Steps

1. **Generate Tests**
    
    - Use Gemini CLI: “Generate Playwright end-to-end tests for web and extension in `apps/web/tests/e2e/` and `apps/extension/tests/e2e/`, covering user sign in, job scraping, resume tailoring, and analytics viewing.”
    - Run: `pnpm --filter @jata/web test:e2e && pnpm --filter @jata/extension test:e2e`.
2. **Accessibility Check**
    
    - Run: `pnpm --filter @jata/web lint:a11y && pnpm --filter @jata/extension lint:a11y`.
3. **Commit**
    
    ```bash
    git add apps
    git commit -m "Add tests and ensure accessibility"
    git push
    ```
    

### Phase 7: Deployment & Instructions (20 min)

**Goal**: Deploy and provide usage guidance.

#### Steps

1. **Deploy Frontend**
    
    - Run: `pnpm --filter @jata/web build && netlify deploy --prod`.
2. **Package Extension**
    
    - Build: `pnpm --filter @jata/extension build`.
    - Load into Chrome/Firefox/Edge as unpacked extension.
3. **Usage Instructions**
    
    - Use Windsurf: “Generate a README in `README.md` with detailed step-by-step instructions, including screenshots or diagrams, to install the extension, sign into the dashboard, scrape jobs, and tailor resumes.”
    - Commit: `git add README.md && git commit -m "Add usage instructions" && git push`.

## Risks & Fallbacks

- **Windsurf Limits**: Free tier may have prompt limits; use Cursor/Codeium if needed.
- **Supabase Limits**: Monitor 500MB DB and 1GB storage; scale down if exceeded.
- **Netlify Functions**: Ensure `apps/api` has valid function files (e.g., `exports.handler`).