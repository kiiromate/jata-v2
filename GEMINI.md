# JATA V2 - Gemini CLI Master Guide

This is the single source of truth for the Gemini CLI in the JATA project. All prompts and instructions are designed for a pnpm monorepo using Supabase/Deno and React/Vite.

## 1. Core Instructions & Standards

- **Technology Stack**: Supabase Edge Functions (Deno), PostgreSQL, React 18, Vite, TypeScript, Tailwind CSS, Zustand, TanStack Query.
- **Coding Standards**: Strict TypeScript, `camelCase` variables, `PascalCase` types, JSDoc comments, no sensitive data logging.
- **Deno Imports**: All Deno imports must be from full URLs (e.g., `https://deno.land/x/...`).
- **File Context**: Prompts must be specific and reference the exact file paths within the monorepo.
- **Database Types**: Reference generated types from `packages/common/types/database.ts`.

---

## 2. Phase 2: Backend Generation (Edge Functions)

### Task 2.1: Generate `applications-create` Edge Function

**Prompt:**
"Generate the full TypeScript code for the file `apps/api/supabase/functions/applications-create/index.ts`.
This Supabase Edge Function handles `POST` requests.
- It must handle CORS preflight `OPTIONS` requests by calling a shared `cors` handler.
- The main logic should parse the incoming JSON body against a Zod schema named `applicationCreateSchema`.
- It must get the authenticated user's session from the `Authorization` header.
- If authentication is successful, it inserts a new record into the `applications` table, ensuring the `user_id` from the session is included.
- Return a `201 Created` response with the newly created application data.
- Import dependencies using Deno-style URLs: `zod` from `https://deno.land/x/zod@v3.22.4/mod.ts`, Supabase client from `https://esm.sh/@supabase/supabase-js@2.39.0`.
- Reference shared utilities from the `_shared` directory, like `import { cors } from '../_shared/cors.ts'`.
- Include comprehensive JSDoc comments and error handling for 400, 401, and 500 status codes."

### Task 2.2: Generate Tests for `applications-create`

**Prompt:**
"Generate the full Jest test suite for the file `apps/api/supabase/functions/applications-create/index.test.ts`.
- Mock the Supabase client, specifically the `.from().insert()` chain and the `auth.getUser()` method.
- **Test Case 1 (Success):** Should test a valid `POST` request with a correct auth header and body, asserting that the function returns a `201` status and the correct JSON payload.
- **Test Case 2 (Unauthorized):** Should test a request with a missing or invalid `Authorization` header, asserting a `401` status.
- **Test Case 3 (Bad Request):** Should test a request with an invalid request body (e.g., missing a required field), asserting a `400` status.
- **Test Case 4 (Server Error):** Should test the case where the database `insert` operation throws an error, asserting a `500` status."

---

## 3. Phase 3: Frontend Generation (Dashboard)

### Task 3.1: Generate `Dashboard.tsx` Component

**Prompt:**
"Generate the full React component code for the file `apps/web/src/pages/Dashboard.tsx`.
- The component must be written in TypeScript (`.tsx`) and use React 18 hooks.
- Use Tailwind CSS for all styling, following the JATA design system colors (`bg-cool-gray`, `text-jet-black`, accent `soft-olive`).
- Fetch application data using TanStack Query's `useQuery` hook. The query function should call a Supabase client instance to fetch data.
- Display the applications in a responsive table with columns: 'Job Title', 'Company', 'Status', 'Date Applied'.
- Include filter buttons (`All`, `Applied`, `Interview`) that use a Zustand store to manage the active filter state.
- Use TanStack Query's `useMutation` hook to handle the creation of a new application through a modal form.
- The component must show clear loading and error states.
- Ensure all elements are accessible according to WCAG 2.1 AA standards (e.g., `aria-label` for buttons, keyboard navigation for the table and modal)."