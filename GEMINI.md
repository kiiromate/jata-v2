# JATA V2 - Gemini CLI Master Guide

This is the single source of truth for the Gemini CLI in the JATA project. It defines the standards, technologies, and architectural patterns for all code generation.

## 1. Core Instructions & Standards

- **Technology Stack**: Supabase Edge Functions (Deno), PostgreSQL, React 18, Vite, TypeScript, Tailwind CSS, Zustand, TanStack Query.
- **Coding Standards**: Strict TypeScript, `camelCase` for variables/functions, `PascalCase` for types/components. All functions and components must have JSDoc comments.
- **Security**: Never log sensitive data. All backend operations must be authenticated and authorized against the user's ID.
- **File Context**: Prompts must be specific and reference the exact file paths within the monorepo (e.g., `apps/web/src/...`).
- **Database Types**: All database interactions must use the generated types from `packages/common/types/database.ts` for end-to-end type safety.

---

## 2. Backend Architectural Guide (Phase 2 - Completed)

All Supabase Edge Functions must adhere to the following structure:
- **CORS Handling**: Handle preflight `OPTIONS` requests first.
- **Authentication**: Extract the JWT from the `Authorization` header and validate the user session with `supabase.auth.getUser()`. Reject unauthenticated requests with a `401` error.
- **Input Validation**: Use Zod schemas from `apps/api/supabase/functions/_shared/schemas.ts` to validate incoming request bodies or URL parameters. Reject invalid data with a `400` error.
- **Business Logic**: Perform the database operation (select, insert, update, delete), ensuring all queries are filtered by the authenticated user's ID (`user_id`).
- **Responses**: Return appropriate HTTP status codes (`200` OK, `201` Created, `204` No Content) and JSON payloads. Return `500` for unexpected server errors.

---

## 3. Frontend Architectural Guide (Phase 3 - In Progress)

The `apps/web` dashboard application will be built on the following principles:

- **Authentication**: A central `AuthContext` will manage the user's session state (`user`, `session`, `loading`) throughout the application, populated by the Supabase client.
- **Routing**: Use `react-router-dom` to manage navigation. A `ProtectedRoute` component will wrap all pages that require authentication, redirecting unauthenticated users to a `/login` page.
- **Data Fetching**: Use **TanStack Query** for all server state management.
  - `useQuery` to fetch data (e.g., the list of applications).
  - `useMutation` to create, update, or delete data, with automatic cache invalidation to keep the UI in sync.
- **State Management**: Use **Zustand** for simple, global UI state that doesn't belong on the server, such as the state of filters or modal visibility.
- **Styling**: Use **Tailwind CSS** for all styling, adhering to the JATA design system colors defined in `tailwind.config.js`.
- **Component Structure**: Components should be small, single-purpose, and well-documented.
- **Accessibility**: All components must be accessible and compliant with WCAG 2.1 AA standards (semantic HTML, ARIA labels, keyboard navigability).