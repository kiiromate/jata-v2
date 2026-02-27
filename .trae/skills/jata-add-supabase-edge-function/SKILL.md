---
name: jata-add-supabase-edge-function
description: Creates a Supabase Edge Function with CORS, Zod validation, and auth. Invoke when adding a new endpoint in supabase/functions.
---

# Add Supabase Edge Function

## When to invoke
- You need a new backend endpoint in Supabase
- You are moving complex logic out of the client

## Inputs to collect
- Function name (kebab case, example: `applications-read`)
- Request shape (method, body, query params)
- Auth requirement (public, user, admin)

## Implementation steps
1. Create folder: `supabase/functions/<function-name>/`.
2. Implement `index.ts` using:
   - CORS preflight handling
   - Zod schema validation at the boundary
   - Shared helpers from `supabase/functions/_shared/*` when available
3. Return consistent JSON errors with HTTP status codes.
4. Add minimal logging with request context only.

## Code standards
- Add concise function-level comments for exported functions.
- Do not log secrets or raw tokens.
- Prefer typed DB access with the shared `Database` type.

## Verification
- Run Supabase functions locally and call the endpoint.
- Confirm auth and error cases return expected status codes.

## Example invocation
"Create an Edge Function named resumes-analyze. It accepts { resumeText, jobDescription } and returns { score, missingSkills }. User auth required."