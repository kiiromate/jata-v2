---
name: jata-regenerate-db-types
description: Aligns Supabase generated types and imports. Invoke when Database typing is missing or broken in web or extension.
---

# Regenerate and align database types

## When to invoke
- TypeScript cannot find `Database` types
- Supabase client types are `any` or missing
- The generated types file is empty or stale

## Implementation steps
1. Decide the single source of truth for DB types.
   - Preferred: generate into `packages/common/src/database.types.ts` and export from `@jata/common`.
2. Ensure all imports point to that source.
   - Web: `apps/web/src/lib/supabaseClient.ts`
   - Extension: `apps/extension/src/lib/supabaseClient.ts`
3. Ensure the file is not empty and compiles.
4. Add a minimal check or CI step to prevent empty type output.

## Verification
- Run `pnpm lint` and ensure no type errors.
- Confirm Supabase client calls are fully typed.

## Example invocation
"Fix the repo so Database types come from @jata/common and the web supabase client is fully typed."