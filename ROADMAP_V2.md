# JATA V2 Phased Completion Roadmap

## Phase 1: Vercel & Deployment Readiness (Immediate)
**Goal:** Ensure the web app and extension are deployable and production-ready.

- [x] **Audit Build System:** Verify `pnpm build` works for `@jata/web` and `@jata/extension`. (Completed)
- [ ] **Configure Vercel:** Add `vercel.json` and ensure correct output directory (`apps/web/dist`).
- [ ] **Environment Variables:** Document all required env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_HUGGING_FACE_API_KEY`) for Vercel production.
- [ ] **CI/CD Pipeline:** Set up GitHub Actions to build and lint on every push.

## Phase 2: Core Features Completion (Next 2 Sprints)
**Goal:** Finish critical "must-have" features for the MVP.

- [ ] **Extension-Dashboard Sync:** Ensure scraped jobs appear instantly in the dashboard via Supabase.
- [ ] **Resume Tailoring Pipeline:** Finalize the AI service integration (Hugging Face) to reliably generate tailored bullet points.
- [ ] **Authentication Polish:** Fix "Invalid Refresh Token" errors and ensure persistent sessions work seamlessly between extension and web.

## Phase 3: Quality & Polish (Pre-Launch)
**Goal:** Eliminate bugs and improve UX.

- [ ] **Design System Consistency:** Audit all pages to strictly follow the new Deep Carbon / Lumen Lime tokens.
- [ ] **Error Handling:** Add user-friendly toasts for API failures (e.g., "Resume upload failed").
- [ ] **Performance:** Optimize bundle size (currently >500kB chunks) using lazy loading for heavy routes.
- [ ] **Accessibility:** Run a final a11y audit (WCAG 2.1 AA) on key flows.

## Phase 4: Launch & Operations
**Goal:** Go live and monitor.

- [ ] **Production Deploy:** Deploy to Vercel Production.
- [ ] **Extension Store:** Submit to Chrome Web Store (requires privacy policy URL).
- [ ] **Monitoring:** Verify Sentry and PostHog are capturing production data.
