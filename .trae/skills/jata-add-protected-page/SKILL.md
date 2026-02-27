---
name: jata-add-protected-page
description: Scaffolds a new protected web page and route. Invoke when adding a dashboard page in apps/web.
---

# Add protected web page

## When to invoke
- You are adding a new page that requires auth
- You need a new route under the dashboard shell

## Inputs to collect
- Page component name (example: `BillingPage`)
- Route path (example: `/billing`)
- Navigation placement (sidebar, header, or none)

## Implementation steps
1. Create `apps/web/src/pages/<PageName>.tsx`.
2. Use existing design tokens and shadcn components.
3. Add the route in `apps/web/src/App.tsx` under protected routes.
   - Wrap with `ProtectedRoute` and `DashboardLayout`.
4. If navigation is needed, update the existing nav component used by `DashboardLayout`.

## Code standards
- Add concise function-level comments for any new functions.
- Avoid direct Supabase calls in the page component.
- Use `@/` imports.

## Verification
- Run `pnpm -C apps/web lint`.
- Start dev server and confirm routing works.

## Example invocation
"Add a protected page named BillingPage at /billing and add it to the sidebar."