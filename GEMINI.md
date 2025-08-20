# JATA V2 - Gemini CLI Master Guide

This is the single source of truth for the JATA project. It defines the standards, technologies, and architectural patterns for all code generation.

---
## Act I: Core Functionality (Completed)
This act focused on building the core, end-to-end user workflow. It covered the initial build through Phase 11, resulting in a stateful application where a user can manage resumes, analyze job descriptions, generate content, and view analytics.

---
## Act II: Productization & Polish (In Progress)

This act transforms the functional application into a professional, user-friendly, and robust product ready for V1 launch, based on the Product Strategy Document.

### 12. Critical Bug Fixes & Security Hardening
This phase addresses blocking issues that compromise the application's integrity and core user experience. Key tasks include fixing the authentication bypass vulnerability and resolving the failing onboarding modal UX.

### 13. The Professional Shell & Brand Identity
This phase establishes the application's public-facing identity and core navigational structure. It involves creating a public landing page, a consistent app layout (header/footer), and updating branding elements (site title, favicon, logo placeholders).

### 14. Polishing the Core Experience
This phase addresses key usability and UX friction points in the authentication and onboarding flows. It includes improving form UX (password visibility), enhancing validation, and creating a stable, intentional onboarding sequence.

---
### 15. The JATA Design System V1 & Initial Redesign
This phase implements the initial redesign of the application's visual identity, heavily inspired by `superhi.com`. This includes adopting the new typography, layout principles, and scroll-triggered animations for the landing page.

### 15.5. Polishing the User Journey & Design System V2
This phase focuses on critical UX details that make the application feel cohesive and professional. Key tasks include:
    *   **Customizing System Emails**: Configuring Supabase Auth to use custom, branded email templates for a seamless onboarding experience.
    *   **Implementing a Cohesive Theme**: Re-implementing a robust light/dark mode theme that uses a defined, modern color palette and applies it consistently across the entire application.
    *   **Refining the Onboarding Flow**: Optimizing the timing and presentation of the "Install Extension" prompt to feel more organic and less intrusive.
    *   **Finalizing the Extension Workflow**: Creating a dedicated page that provides clear, step-by-step instructions for manually installing the browser extension.

### 16. Go-To-Market Readiness
This final phase prepares the application for public launch. It includes implementing foundational SEO, setting up product analytics (PostHog), error tracking (Sentry), and ensuring the deployment pipeline is stable and documented.