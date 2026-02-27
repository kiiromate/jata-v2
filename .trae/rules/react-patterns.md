---
alwaysApply: true
globs:
  - "apps/web/src/**/*"
---

# React and component patterns

## Routing
- React Router routes live in `apps/web/src/App.tsx`
- Protected routes wrap pages with `ProtectedRoute` and `DashboardLayout`

## File placement
- Pages: `apps/web/src/pages/*`
- Shared components: `apps/web/src/components/*`
- shadcn components: `apps/web/src/components/ui/*`
- Hooks: `apps/web/src/hooks/*`
- Services (API-like calls): `apps/web/src/services/*`
- Shared utilities: `apps/web/src/lib/*` or `apps/web/src/utils/*`

## Data and state
- Server state: TanStack Query
- UI state: Zustand (only when state is shared)
- Avoid direct Supabase calls inside React components: use services or hooks

## TypeScript discipline
- Keep `strict` TypeScript discipline
- Avoid `any`; prefer `unknown` with type guards
- Avoid type assertions unless unavoidable and justified

