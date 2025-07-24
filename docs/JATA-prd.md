# JATA Product Requirements Document (PRD)

**Project Name:** JATA (Job Application Tracker & Optimization App)  
**Version:** 2.0  
**Date:** July 15, 2025  
**Purpose:** JATA is a web application with a browser extension designed to streamline the job application process. It empowers job seekers by automating job detail extraction, providing AI-driven resume tailoring, and offering a dashboard with analytics to track applications and identify high-success opportunities. Built with free, open-source tools, JATA operates within a zero-budget constraint, prioritizing user privacy, scalability, and compatibility across major browsers and job boards.

## 1. Executive Summary

### Mission Statement
JATA (Job Application Tracker & Optimization App) transforms the job application process by automating repetitive tasks, providing AI-driven insights, and offering a centralized platform for tracking and optimizing applications. Its mission is to empower job seekers to focus on high-potential opportunities, enhancing their chances of landing their dream job while keeping operational costs at zero.

### Key Pain Points Addressed
- **Manual Data Entry:** Job seekers waste time copying job details (title, company, description) from various job boards.
- **Resume Customization:** Tailoring resumes for each job to pass ATS filters is time-consuming and complex.
- **Application Tracking:** Managing multiple applications across platforms leads to missed follow-ups and disorganized workflows.
- **Lack of Insights:** Users struggle to identify which roles, industries, or sources yield better response rates, hindering strategic focus.

### Goals & Success Metrics
- **SMART Goals:**
  - **Specific & Measurable:** Achieve a 20% average response rate improvement within 3 months of launch.
  - **Achievable & Relevant:** Reduce average time-to-apply by 50% compared to manual methods.
  - **Time-bound:** Attain a 70% user retention rate after 6 months.
- **Quantitative Metrics:**
  - Response rate per application (target: 20% improvement).
  - Time-to-apply for each job (target: <5 minutes).
  - Number of applications tracked (target: 1,000+ in 6 months).
  - User engagement with AI tailoring and analytics features (target: 80% feature usage).
  - Cost savings: 100% free for users, with no hidden fees.

## 2. User Personas

JATA serves a diverse range of job seekers. Below are three distinct personas with their needs, frustrations, and success criteria:

### 2.1 Recent Graduate
- **Profile:** Early-career individual, 22–25 years old, seeking entry-level roles.
- **Needs:** Apply to numerous positions quickly with minimal experience.
- **Frustrations:** Overwhelmed by application volume, unsure how to tailor resumes effectively, limited professional experience.
- **Success Criteria:** Secure at least one interview within the first month of using JATA.

### 2.2 Career Switcher
- **Profile:** Mid-career professional, 30–40 years old, transitioning to a new industry.
- **Needs:** Highlight transferable skills and adapt resumes for unfamiliar roles.
- **Frustrations:** Difficulty presenting experience for a new field, time-consuming research for industry-specific keywords.
- **Success Criteria:** Receive positive feedback on resume or land an interview in the new industry.

### 2.3 High-Volume Applicant
- **Profile:** Active job seeker, 25–35 years old, applying to dozens of roles weekly.
- **Needs:** Efficiently manage and track large application volumes, identify high-success opportunities.
- **Frustrations:** Forgetting application statuses, missing follow-ups, wasting time on low-potential roles.
- **Success Criteria:** Increase response rate by 15% and reduce time spent on low-potential applications.

## 3. User Journeys & Flows

### 3.1 Core Happy Path
1. **Job Discovery:** User finds a job posting on a job board (e.g., LinkedIn, Indeed).
2. **Extraction:** Uses JATA’s browser extension to extract job details (title, company, description, URL) with one click.
3. **Logging:** Details are automatically logged to the JATA dashboard.
4. **Resume Upload:** User uploads their resume to the dashboard.
5. **AI Tailoring:** JATA’s AI analyzes the resume and job description, suggesting keywords, section reordering, and ATS-friendly formatting.
6. **Application Submission:** User downloads the tailored resume and submits the application, optionally using JATA’s autofill feature.
7. **Status Updates:** User updates the application status (e.g., Applied, Interviewed, Offered) on the dashboard.
8. **Analytics Review:** User views analytics to identify trends (e.g., “Tech roles have a 20% higher response rate”) and optimize future applications.

### 3.2 Alternate Flows
- **Bulk Application Intake:**
  1. User collects a folder of job postings (PDFs, HTMLs) or a CSV file with job details.
  2. Uploads the folder or CSV to the JATA dashboard.
  3. JATA auto-extracts job details and creates application cards in bulk.
  4. User tailors resumes and submits applications for each job.

- **Manual Scrape Fallback:**
  1. User encounters an unsupported job board.
  2. Activates the “Scrape Now” feature in the extension.
  3. JATA prompts the user to map fields (title, description, etc.) by clicking on page elements.
  4. Extracted data is logged to the dashboard.

- **Autofill Toggle:**
  1. User navigates to a job application form.
  2. Activates the autofill feature in the JATA extension.
  3. JATA maps user profile fields (name, email, etc.) to form inputs using pre-defined or user-saved mappings.
  4. User reviews mappings, confirms, and submits the form.

## 4. Feature List & Prioritization

### 4.1 MVP Features
These features form the core of JATA’s initial release:

| **Feature** | **Description** | **User Benefit** | **Complexity** | **Dependencies** |
|-------------|-----------------|------------------|----------------|------------------|
| **Browser Extension for Job Detail Extraction** | Point-and-click extraction of job details (title, company, description, URL) from web pages. | Saves time by automating data entry. | Medium | None |
| **AI Resume Tailoring** | Analyzes user’s resume and job description to suggest keywords, section reordering, and ATS-friendly formatting. | Increases ATS compatibility and recruiter appeal. | High | Internet connection for Hugging Face API |
| **Application Tracking Dashboard** | Centralized view of applications with metadata (status, date, role, industry, source). | Organizes application progress and deadlines. | Low | Backend API |
| **Basic Analytics** | Visualizes response rates, status breakdowns, and application trends using Recharts. | Identifies high-success opportunities. | Medium | Sufficient application data |

### 4.2 Phase 2 Features (Upgrades)
These features enhance JATA post-MVP:

| **Feature** | **Description** | **User Benefit** | **Complexity** | **Dependencies** |
|-------------|-----------------|------------------|----------------|------------------|
| **Built-in Web Scraper** | Extracts job details from any job board URL with user-assisted mapping and CAPTCHA fallback. | Supports all job boards, not just pre-defined ones. | High | None (client-side processing) |
| **Bulk Application Intake** | Uploads folders or ZIPs of PDFs/HTMLs for batch extraction of job details. | Processes multiple postings efficiently. | Medium | None (client-side processing) |
| **Reverse-Autofill Form Module** | Toggleable auto-fill for job application forms with reusable mappings per job board. | Speeds up form submission. | High | WebExtensions scripting API |

## 5. Non-Functional Requirements

- **Zero-Budget:** Built exclusively with free, open-source tools and free-tier services (e.g., Netlify Bolt [https://www.netlify.com], Vercel v0 [https://vercel.com], SQLite [https://www.sqlite.org]).
- **Privacy:** Sensitive data (resumes, personal info) processed client-side or encrypted at rest using AES-256. No data sold or shared.
- **Scalability:** Minimal per-user compute/memory footprint. Stateless serverless functions (e.g., Netlify Functions) ensure sub-500ms response times for 1,000 concurrent users.
- **Compatibility:** Supports Chrome, Firefox, and Edge via WebExtensions API [https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions]. Responsive dashboard for mobile, tablet, and desktop.
- **Design System & UI Principles:**
  - **Theme:** “Efficiency Meets Opportunity” – minimalist, inspired by Dieter Rams’ principles [https://www.vitsoe.com/us/about/good-design].
  - **Color Palette:**
    - Day Mode: Cool Gray (#D3D7D9) background, Pure White (#FFFFFF) text, Soft Olive (#A3BFFA) accents.
    - Night Mode: Jet Black (#1C2526) background, Light Gray (#E5E7EB) text, Charcoal Gray (#4A4A4A) borders.
  - **Typography:** Inter font, 16px body, 20px headings, 14px secondary text [https://fonts.google.com/specimen/Inter].
  - **Animations:** Subtle GSAP fades (0.3s) and hovers (scale 1.05x) for feedback [https://greensock.com/gsap].
  - **Accessibility:** WCAG 2.1 compliance (4.5:1 contrast), keyboard-first navigation, ARIA roles [https://www.w3.org/WAI/standards-guidelines/wcag].

## 6. Data Model & Architecture Overview

### 6.1 Data Model
- **Entities:**
  - **User:** Stores profile information (ID, name, email, preferences).
  - **Application:** Represents a job application (ID, title, company, description, URL, status, date applied, industry, source).
  - **ScrapeConfig:** Stores user-defined mappings for scraping (domain, field, selector).
  - **BulkJob:** Represents batch-uploaded jobs (ID, file type, extracted data).
  - **Mapping:** Stores autofill mappings (domain, field, selector).

- **Storage:**
  - **MVP:** SQLite for lightweight, file-based storage.
  - **Future:** PostgreSQL for multi-tenancy and scalability [https://www.postgresql.org].

### 6.2 Architecture
- **Frontend:** Vite + React (TypeScript) for dashboard and extension popup [https://vitejs.dev].
- **Backend:** Node.js (Express) as serverless functions on Netlify [https://expressjs.com].
- **AI:** Hugging Face Inference API (free tier) for NLP tasks [https://huggingface.co].
- **Scraping:** Client-side with Puppeteer [https://pptr.dev]; optional server-side with Cloudflare Workers [https://workers.cloudflare.com].

## 7. Risks & Mitigations

| **Risk** | **Description** | **Mitigation** |
|----------|-----------------|----------------|
| **Scraper Bot Detection** | Job boards may block scrapers with CAPTCHAs or rate limits. | Prioritize user-assisted mapping; use headless scraping sparingly for pre-approved boards (e.g., LinkedIn, Indeed). Implement CAPTCHA fallback prompting user to solve inline challenges. |
| **PDF Parsing Edge Cases** | Complex or scanned PDFs may fail to parse correctly. | Use pdf.js for text extraction [https://mozilla.github.io/pdf.js]; offer OCR fallback with Tesseract.js [https://github.com/naptha/tesseract.js]. Provide user feedback on parsing success. |
| **Selector Drift in Autofill** | Job boards may change form structures, breaking mappings. | Allow users to re-map fields via a simple UI; store custom mappings in chrome.storage.sync [https://developer.chrome.com/docs/extensions/reference/storage]. Update predefined mappings based on user reports. |

## 8. Appendix

### 8.1 Glossary
- **ATS:** Applicant Tracking System – software for managing job applications.
- **NLP:** Natural Language Processing – AI techniques for text analysis.
- **WebExtensions API:** Cross-browser API for building extensions [https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions].

### 8.2 References to Free-Tool Libraries
- **Puppeteer:** Headless Chrome control for scraping [https://pptr.dev].
- **pdf.js:** JavaScript PDF parser [https://mozilla.github.io/pdf.js].
- **fflate:** WASM-based ZIP decompressor [https://github.com/101arrowz/fflate].
- **chrome.autofill:** Browser API for form autofill (experimental) [https://developer.chrome.com/docs/extensions/reference/autofill].
- **Hugging Face Inference API:** Free NLP models [https://huggingface.co].
- **Recharts:** Charting library for analytics [https://recharts.org].