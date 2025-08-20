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

## 5. AI Service Architectural Guide (Phase 5 - completed)

The AI module, initially built with a regex engine, has been enhanced with a multi-layered refinement strategy to ensure accurate, high-signal, and actionable feedback.
The architecture follows a three-stage pipeline executed on the client-side within aiService.ts:
Text Pre-processing: Before analysis, all input text (from job descriptions and resumes) is programmatically cleaned. This includes converting to lowercase, removing punctuation, and standardizing common terms to ensure data consistency.
Regex-Based Skill Extraction: The core extraction continues to use a stable, deterministic regex engine as a baseline to identify potential skills and keywords.
Post-processing and Filtering: The raw output from the regex engine is passed through a strict filtering layer. This layer removes common, irrelevant "stop words" (e.g., "experience," "duties") and discards trivial results (e.g., single-character keywords), ensuring the final output presented to the user is clean and meaningful.
This refined approach provides a robust and privacy-preserving analysis, forming 
 the foundation for future enhancements like Zero-Shot Classification for contextual understanding.

---

## 6. User Profile & Resume Vault Architectural Guide (Phase 6)

The application now supports multi-resume management, forming a foundational "Resume Vault" for the user. This architecture consists of three key parts:

1.  **Database Schema**: A dedicated `resumes` table in Supabase stores the resume name, extracted text content, and a foreign key `user_id` linking it to the authenticated user. The table is protected by Row Level Security (RLS) to ensure users can only access their own data.

2.  **File-Parsing Edge Function**: A Supabase Edge Function (`upload-resume`) handles secure file uploads. It authenticates the user, uploads the raw file to Supabase Storage for archival, parses the text content using `pdf-parse` or `mammoth`, and inserts the structured data into the `resumes` table.

3.  **Frontend Integration**: The client-side (`ProfilePage.tsx`) uses a `useQuery` hook to fetch and display the user's list of resumes and a `useMutation` hook to call the `upload-resume` Edge Function, providing a seamless UX for managing the vault.

---

## 7. AI Content Generation Architectural Guide (Phase 7)

To move beyond analysis into active user assistance, the application incorporates an AI-powered content generation module. This architecture builds upon the user's Resume Vault and the existing AI service.

1.  **Generative Model Integration**: The `aiService.ts` is enhanced with a new function that calls a generative language model on the Hugging Face API (e.g., a fine-tuned instruction model). This function is designed to take a user's basic description of an accomplishment and rewrite it into a professional, impactful bullet point.

2.  **Contextual UI**: The `ResumeTailorPage` is upgraded to be resume-aware. It allows the user to select a specific resume from their vault, which then serves as the context for all AI operations on that page.

3.  **Component-Based Workflow**: The UI for content generation is a dedicated component (`BulletPointGenerator.tsx`) that manages its own state via a `useMutation` hook, ensuring a modular and maintainable implementation.

---

## 8. Workflow Automation & Quality Assurance Architectural Guide (Phase 8)

This phase focuses on removing user friction and increasing application quality through automation and validation.

1.  **URL-Based Job Scraping**: To automate job description input, a new Supabase Edge Function (`scrape-url`) has been created. This function accepts a URL, fetches the page content server-side, and uses Mozilla's `@mozilla/readability` library to parse and extract the main article text, effectively isolating the job description. This provides a robust alternative to fragile, client-side selector-based scraping.

2.  **Client-Side ATS Linter**: To provide immediate feedback on resume formatting, a client-side utility (`atsLinter.ts`) has been implemented. This "linter" runs a series of regex-based checks on the resume's raw text to detect common ATS issues (e.g., missing contact info, absence of standard section headers). It returns a structured array of warnings and suggestions that are displayed in a dedicated UI component, empowering users to fix formatting problems before applying.

---

## 9. Synthesis & Gamification Architectural Guide (Phase 9)

This phase synthesizes all prior analyses into a single, quantifiable metric—the "Jata Score"—to gamify the resume tailoring process and provide users with immediate, actionable feedback.

1.  **Client-Side Score Synthesis**: A dedicated utility, `jataScoreCalculator.ts`, is responsible for calculating the score. This pure function takes the outputs from the Zero-Shot analysis, the keyword comparison, and the ATS linter as inputs. It applies a predefined weighting system to these inputs to generate a final score out of 100, along with a breakdown of sub-scores for each category.

2.  **Dynamic & Reactive UI**: The score is displayed in a dedicated `JataScore.tsx` component, which uses a charting library (Recharts) to visualize the score in a radial progress chart. The main `ResumeTailorPage` orchestrates the system, using a `useEffect` hook to automatically recalculate the score whenever the underlying resume text or job description changes, ensuring the user sees the impact of their edits in real-time.

---

## 10. State Persistence & Application Hub Architectural Guide (Phase 10)

To transform JATA into a persistent system of record, this phase introduces a robust state-saving and state-loading architecture, turning the `ResumeTailorPage` into a persistent workspace.

1.  **Schema Enhancement**: The `applications` table is augmented with columns to store the complete context of a tailoring session (`jata_score`, `final_resume_text`, `job_description`, `selected_resume_id`, etc.).

2.  **State-Saving & Loading**:
    *   **Saving**: A `save-application-analysis` Edge Function handles `PATCH` requests to update an application record with the final analysis data.
    *   **Loading**: The `ResumeTailorPage` is architected to be stateful. On initial load, its `useQuery` for application details fetches the previously saved analysis. The component then uses this data to pre-populate all relevant states (the selected resume, the job description, the Jata score, etc.), seamlessly restoring the user's last saved session.

---

## 11. Analytics & Insights Architectural Guide (Phase 11)

To provide users with actionable intelligence, this phase introduces a dedicated analytics dashboard. The architecture is designed for performance and clarity.

1.  **Backend Data Aggregation**: To avoid slow client-side calculations, a PostgreSQL RPC function (`get_user_analytics`) performs all aggregations on the server-side. It calculates application funnel stages, average Jata Scores by status, and **a breakdown of success rates (interviews and offers) grouped by application source**.

2.  **Dedicated Analytics Frontend**: The `/analytics` page serves as the hub for all data visualizations, making a single call to the `get_user_analytics` RPC endpoint.

3.  **Modular Chart Components**: Visualizations are encapsulated in reusable `Recharts` components (`ApplicationFunnelChart.tsx`, `ScoreAnalysisChart.tsx`, and `SuccessBySourceChart.tsx`), ensuring a clean separation of concerns.

---

## 12. Polish, Onboarding & Deployment Architectural Guide (Phase 12)

This final phase focuses on user experience, documentation, and production readiness to ensure the application is welcoming, understandable, and robust.

1.  **User Onboarding & Empty States**: To guide new users, the application's main pages (Dashboard, Analytics) are architected to be "state-aware." They conditionally render a dedicated `Welcome.tsx` or empty-state component when the underlying data is not yet present. This provides clear calls-to-action and improves the first-time user experience.

2.  **Contextual Help System**: To enhance clarity, a lightweight help system using `shadcn/ui`'s `Tooltip` component is integrated into the analytics charts. This provides users with non-intrusive, on-demand explanations of what each metric means.

3.  **Production Deployment Workflow**: The project's build and deployment process is hardened for production.
    *   **Build Script**: The `apps/web` `build` script in `package.json` is simplified to `vite build`, making Vite the single source of truth and preventing conflicts with standalone `tsc` checks.
    *   **Monorepo Pathing**: The `apps/web/tsconfig.json` and `vite.config.ts` are explicitly configured with path aliases (`@jata/common/*`) and the `vite-tsconfig-paths` plugin to ensure reliable module resolution in a CI/CD environment.
    *   **Node.js Polyfills**: Vite's `resolve.alias` configuration is used to explicitly polyfill Node.js-specific modules (like `fs`) with browser-safe alternatives (like `memfs`), preventing runtime errors in the deployed application.
