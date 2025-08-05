# JATA V2 - Gemini CLI Master Guide

This is the single source of truth for the Gemini CLI in the JATA project. It defines the standards, technologies, and architectural patterns for all code generation.

## 1. Core Instructions & Standards

- **Technology Stack**: Supabase Edge Functions (Deno/TypeScript), PostgreSQL, React 18, Vite, Tailwind CSS, Zustand, TanStack Query, WebExtension Manifest V3.
- **Coding Standards**: Strict TypeScript, `camelCase` for variables/functions, `PascalCase` for types/components. All functions and components must have JSDoc comments explaining their purpose.
- **Security**: Never log sensitive data. All backend operations must be authenticated and authorized against the user's ID via Supabase Auth helpers.
- **Monorepo File Context**: Prompts must reference exact file paths (e.g., `apps/web/src/...`). All database interactions must use the generated types from `packages/common/types/database.ts` for end-to-end type safety.
- **Accessibility**: All generated UI must be compliant with WCAG 2.1 AA standards. This includes semantic HTML, full keyboard navigability, and appropriate ARIA roles.
- **Design System**: UI must adhere to the JATA theme of "Efficiency Meets Opportunity." Use the official color palette (`cool-gray`, `soft-olive`, `jet-black`, etc.) as defined in `tailwind.config.js`.

---

## 2. Backend Architectural Guide (Phase 2 - Completed)

All Supabase Edge Functions adhere to the following structure:
- **CORS Handling**: Handle preflight `OPTIONS` requests first using the shared `cors.ts` handler.
- **Authentication**: Extract the JWT from the `Authorization` header and validate the user session with `supabase.auth.getUser()`. Reject unauthenticated requests with a `401` error.
- **Input Validation**: Use Zod schemas from `apps/api/supabase/functions/_shared/schemas.ts` to validate all incoming data. Reject invalid data with a `400` error.
- **Business Logic**: Perform the database operation (select, insert, update, delete), ensuring all queries are filtered by the authenticated user's ID (`user_id`).
- **Responses**: Return appropriate HTTP status codes (`200` OK, `201` Created, `204` No Content) and JSON payloads.

---

## 3. Frontend Architectural Guide (Phase 3 - Completed)

The `apps/web` dashboard application is built on the following principles:
- **Authentication**: A central `AuthContext` manages the user's session state (`user`, `session`, `loading`).
- **Routing**: `react-router-dom` manages navigation. A `ProtectedRoute` component wraps all pages requiring authentication.
- **Data Fetching**: Use **TanStack Query** for all server state management (`useQuery` for reads, `useMutation` for writes).
- **State Management**: Use **Zustand** for simple, global UI state (e.g., filters, modal visibility).
- **Styling & Components**: Use **Tailwind CSS** and build small, single-purpose, accessible components.

---

## 4. Browser Extension Architectural Guide (Phase 4)

The `apps/extension` browser extension must be generated according to these strict architectural patterns:

- **Manifest**: Must be **Manifest V3**. Required permissions are `storage`, `scripting`, and `activeTab`. Host permissions must be set to `*://*/*`.
- **Core Components**: The extension has three main parts:
  1.  `background.ts`: The service worker, acting as a message router.
  2.  `contentScripts/scraper.ts`: The content script for interactive element selection.
  3.  `popup/App.tsx`: The React-based UI.
- **Communication Protocol**: A strict four-step message passing flow (Popup -> Background -> Content Script -> Background -> Popup) must be used.
- **Scraping Logic**: The "Interactive Mapping" flow from `extension-design.md` must be followed (overlay, highlight, capture, cleanup).
- **Backend Integration**: The popup uses its own Supabase client instance and retrieves the user's auth token from `chrome.storage.local`.