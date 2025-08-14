# JATA V2 - Gemini CLI Master Guide

This is the single source of truth for the Gemini CLI in the JATA project. It defines the standards, technologies, and architectural patterns for all code generation.

## 1. Core Instructions & Standards

- **Technology Stack**: Supabase Edge Functions (Deno/TypeScript), PostgreSQL, React 18, Vite, Tailwind CSS, Zustand, TanStack Query, WebExtension Manifest V3.
- **Coding Standards**: Strict TypeScript, `camelCase` for variables/functions, `PascalCase` for types/components. All functions and components must have JSDoc comments.
- **Security**: Never log sensitive data. API keys must be stored in `.env` files. Client-side code must *never* use the `service_role_key`.
- **Monorepo File Context**: Prompts must reference exact file paths. All database interactions must use the generated types from `packages/common/types/database.ts`.
- **Accessibility**: All generated UI must be compliant with WCAG 2.1 AA standards.
- **Design System**: UI must adhere to the JATA theme of "Efficiency Meets Opportunity."

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

## 5. AI Service Architectural Guide (Phase 5 - Enhanced & Refined)

The AI module, initially built with a regex engine, has been enhanced with a multi-layered refinement strategy to ensure accurate, high-signal, and actionable feedback.
The architecture follows a three-stage pipeline executed on the client-side within aiService.ts:
Text Pre-processing: Before analysis, all input text (from job descriptions and resumes) is programmatically cleaned. This includes converting to lowercase, removing punctuation, and standardizing common terms to ensure data consistency.
Regex-Based Skill Extraction: The core extraction continues to use a stable, deterministic regex engine as a baseline to identify potential skills and keywords.
Post-processing and Filtering: The raw output from the regex engine is passed through a strict filtering layer. This layer removes common, irrelevant "stop words" (e.g., "experience," "duties") and discards trivial results (e.g., single-character keywords), ensuring the final output presented to the user is clean and meaningful.
This refined approach provides a robust and privacy-preserving analysis, forming 
 the foundation for future enhancements like Zero-Shot Classification for contextual understanding.

---