---
alwaysApply: true
---

# JATA monorepo architecture rules

## Workspace structure
- Apps are deployable units and live in `apps/*`
- Shared libraries live in `packages/*`
- Supabase Edge Functions live in `supabase/functions/*`
- Avoid adding new runtime code at the repo root

## Package management
- Use pnpm as the package manager
- Internal dependencies must use `workspace:^`
- Do not introduce new `package-lock.json` files

## Naming conventions
- Workspace packages: `@jata/[name]` (example: `@jata/common`)
- React components: PascalCase with semantic names
- Services and utilities: camelCase and descriptive
- Database: snake_case for tables and columns, camelCase in TypeScript

## Imports
Use a stable import order:
1. React and Node built-ins
2. External dependencies
3. Internal workspace packages (`@jata/*`)
4. `@/` alias imports
5. Relative imports
6. Type-only imports last

## Forbidden patterns
- Do not import across apps directly; move shared code into a package
- Avoid circular dependencies between packages
- Do not hardcode secrets or API keys

