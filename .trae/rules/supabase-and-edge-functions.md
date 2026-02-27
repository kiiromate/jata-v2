---
alwaysApply: true
globs:
  - "supabase/**/*"
  - "apps/web/src/lib/supabaseClient.ts"
  - "apps/extension/src/lib/supabaseClient.ts"
---

# Supabase and Edge Functions rules

## Database and RLS
- Every table must have RLS enabled and policies defined
- Prefer enforcing authorization in RLS first, then in application logic
- Do not disable RLS for testing

## Edge Functions (Deno)
- Location: `supabase/functions/[function-name]/index.ts`
- Use shared helpers from `supabase/functions/_shared/*` when available
- Validate inputs at the edge using Zod
- Handle CORS preflight and return consistent JSON errors with HTTP status codes
- Never log secrets; include request context in error logs

## Typed database access
- Shared database types should come from `@jata/common`
- Keep the generated type source consistent across the repo

