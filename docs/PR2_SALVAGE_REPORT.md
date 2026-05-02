# PR2 Salvage Report

## Summary

Old PR #2 was not merged directly. It contains useful UI polish, but it also includes generated build output, zip artifacts, stale route/layout changes, and changes that would remove current AI gateway and security work.

This branch salvages only low-risk source changes that fit the rescued monorepo baseline.

## Imported

- `apps/web/src/components/ApplicationCardSkeleton.tsx`: aligned the loading card with existing `bg-card` and `border-border` theme tokens.
- `apps/web/src/components/AvatarSkeleton.tsx`: added a small avatar loading placeholder using the existing `Skeleton` UI primitive.
- `apps/web/src/components/ProfileFormSkeleton.tsx`: added a profile form loading placeholder using the existing `Skeleton` UI primitive.
- `apps/web/src/components/AvatarUpload.tsx`: replaced plain loading text with `AvatarSkeleton`.
- `apps/web/src/components/ProfileForm.tsx`: replaced plain loading and error text with structured states, and moved profile field hydration from `useQuery` `onSuccess` to `useEffect` for React Query v5 compatibility.
- `apps/web/src/pages/Settings.tsx`: replaced the hardcoded local `delete-user` Edge Function URL with the existing `VITE_SUPABASE_URL` based URL.

## Skipped

- `apps/web/dist/**`: generated build output, not source.
- `apps/web/dist/jata-extension.zip`: generated zip artifact, not source.
- `apps/web/public/jata-extension.zip`: zip artifact requires a separate documented distribution policy.
- `apps/web/src/App.tsx`: old PR route/layout changes conflict with the current rescued app routes, `DashboardLayout`, diagnostic page, legal pages, and toaster setup.
- `apps/web/src/components/Header.tsx`, `IconNav.tsx`, `ThemeToggle.tsx`: current develop already has a richer navigation, feedback, and theme implementation.
- `apps/web/src/components/FeedbackModal.tsx`: current develop already has `FeedbackButton`, `FeedbackDialog`, and `feedbackService`; importing the modal would duplicate the feedback path.
- `apps/web/src/index.css`: old PR modifies design tokens. Design token changes require explicit approval.
- `apps/web/src/pages/InstallExtensionPage.tsx`: old PR depends on a zip artifact that is intentionally not tracked.
- `apps/extension/src/App.js`: generated JavaScript mirror of TypeScript source.
- `apps/extension/src/App.tsx`: current develop already includes the compatible popup UI polish and keeps safer Chrome API guards.
- `apps/extension/manifest.json`: old PR removes `externally_connectable`, which may break current web-extension integration.
- `supabase/migrations/20251029130000_create_feedback_table.sql`: current develop already has a more complete feedback migration with typed feedback categories, status, constraints, and a scoped update trigger.
- `pnpm-lock.yaml` and package files from old PR: old branch is stale against current AI, feedback, and topology work.
- `.vscode/**`, `.windsurf/**`, temp files, and generated artifacts: not needed for source integration.

## Conflicts Resolved

- Preserved current develop for repo topology, AI gateway files, Supabase Edge Functions, privacy/settings services, route structure, and feedback architecture.
- Ported only compatible UI loading states and the delete-user endpoint fix.
- Avoided overwriting current `App.tsx`, `Settings.tsx`, and extension files wholesale.

## Migration Risks

- No migration was imported from old PR #2.
- Existing feedback migration remains unchanged.
- No `supabase db push` was run.

## Recommendation

Old PR #2 should be closed after this replacement branch is reviewed, because it is stale, conflicts with the rescued monorepo, and contains generated artifacts that should not be merged.
