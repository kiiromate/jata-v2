# JATA agent guidelines

## Project context
JATA is a job application tailoring platform built as a pnpm + Turborepo monorepo.

Main surfaces:
- Web app: `apps/web` (React + Vite + React Router)
- Browser extension: `apps/extension` (Manifest V3, Vite build)
- Backend: Supabase (database + auth + Edge Functions in `supabase/functions`)
- Shared packages: `packages/common`, `packages/ui`

## Critical constraints
- No emojis, emoticons, or unicode symbols in any output or code
- No em dashes: use hyphens or colons
- Use simple English and keep answers direct
- For code you generate: add concise function-level comments
- Do not introduce new environment variables without a security review
- Never commit secrets or `.env` files

## Architecture rules of thumb
- Runtime code lives in `apps/*`, `packages/*`, or `supabase/functions/*`
- Web routes are defined in `apps/web/src/App.tsx` using React Router
- Web imports use `@/` alias for `apps/web/src/*`
- Shared database types should come from `@jata/common` (see `packages/common`)

## What you may do
- Refactor for clarity and maintainability when it reduces complexity
- Add tests and fix failing tests
- Add new pages, components, hooks, services following existing patterns
- Add new Supabase Edge Functions with Zod validation and consistent error handling

## What you must not do
- Change design tokens or Tailwind color mappings without explicit approval
- Add new third-party dependencies without justification and scope review
- Modify Supabase schema without a migration plan (SQL file in `supabase/migrations`)

## When blocked
- If requirements are unclear: ask up to 3 clarifying questions, then proceed with the safest default
- If you find technical debt: mark it as `TECH_DEBT:` and apply a minimal safe fix
- If you find a security risk: stop and flag it for human review

