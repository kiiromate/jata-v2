# JATA V2 - Gemini CLI Master Guide

This is the single source of truth for the Gemini CLI in the JATA project. It defines the standards, technologies, and architectural patterns for all code generation.

## 1. Core Instructions & Standards

- **Technology Stack**: Supabase Edge Functions (Deno/TypeScript), PostgreSQL, React 18, Vite, Tailwind CSS, Zustand, TanStack Query, WebExtension Manifest V3.
- **Coding Standards**: Strict TypeScript, `camelCase` for variables/functions, `PascalCase` for types/components. All functions and components must have JSDoc comments.
- **Security**: Never log sensitive data. All backend operations must be authenticated. API keys for third-party services must be stored in `.env` files and not committed to source control.
- **Monorepo File Context**: Prompts must reference exact file paths. All database interactions must use the generated types from `packages/common/types/database.ts`.
- **Accessibility**: All generated UI must be compliant with WCAG 2.1 AA standards.
- **Design System**: UI must adhere to the JATA theme of "Efficiency Meets Opportunity" using the official color palette.

---

## 2. Backend Architectural Guide (Phase 2 - Completed)

All Supabase Edge Functions adhere to a standard structure of CORS handling, authentication, input validation (Zod), user-scoped business logic, and appropriate HTTP responses.

---

## 3. Frontend Architectural Guide (Phase 3 - Completed)

The `apps/web` dashboard is built on a foundation of React Context for authentication, `react-router-dom` for navigation, TanStack Query for server state, and Zustand for global UI state.

---

## 4. Browser Extension Architectural Guide (Phase 4 - Completed)

The `apps/extension` is a Manifest V3 extension using a strict four-step message passing protocol between the popup, background worker, and content scripts for interactive scraping.

---

## 5. AI Service Architectural Guide (Phase 5)

The AI Resume Tailoring module must be implemented with the following principles:

- **Separation of Concerns**: UI components must be decoupled from the AI API logic. All direct interaction with the Hugging Face API must be contained within a dedicated service module (`apps/web/src/services/aiService.ts`).
- **API Interaction**: The `aiService` will use the `fetch` API to make requests to the Hugging Face Inference API. The chosen model should be suitable for Natural Language Processing tasks like keyword extraction or question-answering.
- **Environment Variables**: The Hugging Face API token is a secret and must be stored in `apps/web/.env` as `VITE_HUGGING_FACE_API_KEY`. The `aiService` will read this key from `import.meta.env`.
- **Data Flow**:
  1. A UI component (e.g., `ResumeTailorPage`) will trigger the AI analysis.
  2. The component will use a **TanStack Query `useMutation` hook** to call a function within the `aiService`.
  3. The `aiService` function will format the request, call the Hugging Face API, and parse the response.
  4. The UI component will handle the `isLoading`, `isError`, and `isSuccess` states from the mutation to provide clear feedback to the user.
- **Error Handling**: The `aiService` must gracefully handle potential API errors (e.g., rate limits, invalid tokens, model loading times) and return structured errors that the UI can interpret and display.