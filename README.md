# JATA: Your AI-Powered Job Application Tailor

JATA (Job Application Tailoring Assistant) is a comprehensive, AI-powered platform designed to revolutionize your job application process. In today's competitive job market, simply applying isn't enough. JATA helps you stand out by intelligently tailoring your resume and applications to each specific job description, maximizing your chances of landing interviews and offers.

## The Problem JATA Solves

Job seekers often face the daunting task of manually customizing their resumes for every application, a time-consuming and often ineffective process. Recruiters and Applicant Tracking Systems (ATS) use keywords and specific formatting to filter candidates, leading to many qualified individuals being overlooked. JATA automates and optimizes this process, ensuring your application speaks directly to the job requirements and passes initial screening hurdles.

## Key Features

*   **Browser Extension for Seamless Scraping**: Effortlessly capture job descriptions from any website with our intuitive browser extension, feeding them directly into JATA for analysis.
*   **AI-Powered Resume Tailoring**: Leverage advanced AI to analyze job descriptions and your resume, providing actionable insights and suggestions to optimize your application content. Generate impactful bullet points tailored to specific roles.
*   **Comprehensive Analytics Dashboard**: Gain valuable insights into your application performance. Track conversion rates from application to interview to offer, understand success rates by application source, and identify areas for improvement.
*   **Jata Score for Instant Feedback**: Receive a quantifiable "Jata Score" for each tailored application, indicating its alignment with the job description and ATS best practices. This gamified metric provides immediate feedback, empowering you to refine your application for maximum impact.
*   **Resume Vault**: Securely store and manage multiple versions of your resume, making it easy to select and tailor the most relevant one for each application.

## Tech Stack

JATA is built with a modern and robust technology stack to ensure performance, scalability, and a great developer experience:

*   **Backend**:
    *   **Supabase Edge Functions**: Deno/TypeScript for serverless functions (e.g., URL scraping, resume parsing, application analysis saving).
    *   **PostgreSQL**: Robust and scalable database for storing application data, user profiles, and resumes.
*   **Frontend**:
    *   **React 18**: A declarative, component-based JavaScript library for building user interfaces.
    *   **Vite**: A fast and opinionated build tool for modern web projects.
    *   **Tailwind CSS**: A utility-first CSS framework for rapidly building custom designs.
    *   **Zustand**: A small, fast, and scalable bear-bones state-management solution.
    *   **TanStack Query**: Powerful asynchronous state management for React, handling data fetching, caching, and synchronization.
    *   **shadcn/ui**: Reusable UI components built with Radix UI and Tailwind CSS.
*   **Browser Extension**:
    *   **WebExtension Manifest V3**: Modern and secure browser extension architecture.
*   **AI Integration**:
    *   **Hugging Face API**: Integration with generative language models for AI-powered content generation.

## Getting Started

Follow these steps to get JATA up and running on your local machine.

### Prerequisites

*   Node.js (v18 or higher recommended)
*   pnpm (package manager)
*   Git
*   Supabase CLI

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/jata.git # Replace with actual repo URL
cd jata
```

### 2. Install Dependencies

JATA uses `pnpm` for efficient monorepo management.

```bash
pnpm install
```

### 3. Set up Environment Variables

Create a `.env` file in the root of the project (`jata/.env`) and populate it with your Supabase and Hugging Face API keys. You will need to create a Supabase project and obtain your API keys from the Supabase dashboard. For Hugging Face, you'll need an API token.

```
# Supabase
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# Hugging Face (for AI content generation)
VITE_HUGGING_FACE_API_KEY=YOUR_HUGGING_FACE_API_KEY
```

### 4. Run the Project Locally

#### Start Supabase Local Development

Ensure your Supabase local development environment is running.

```bash
supabase start
```

#### Run the Web Application

Navigate to the `apps/web` directory and start the development server:

```bash
cd apps/web
pnpm dev
```

The web application will typically be available at `http://localhost:5173`.

#### Run the Browser Extension

For the browser extension, you'll need to build it and load it manually into your browser.

```bash
cd apps/extension
pnpm build
```

Then, load the `dist` folder as an unpacked extension in your browser's extension management page.

### 5. Database Migrations

To apply the database schema, ensure your Supabase local development is running and then push the migrations:

```bash
supabase db push
```

## Deployment

### Deploying Supabase Backend (Functions and Database)

1.  **Link your local project to your Supabase project:**
    ```bash
    supabase link --project-ref your-project-ref
    ```
    (Replace `your-project-ref` with your actual Supabase project reference.)

2.  **Push database migrations to production:**
    ```bash
    supabase db push
    ```

3.  **Deploy Edge Functions:**
    ```bash
    supabase functions deploy --no-verify-jwt
    ```
    (Deploy individual functions or all of them as needed.)

### Deploying Web Frontend

The `apps/web` application can be deployed to any static site hosting provider (e.g., Netlify, Vercel, GitHub Pages).

1.  **Build the project:**
    ```bash
    cd apps/web
    pnpm build
    ```
    This will create a `dist` folder with the production-ready build.

2.  **Configure your hosting provider:**
    *   Set the build command to `pnpm build`.
    *   Set the publish directory to `dist`.
    *   Ensure your production environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_HUGGING_FACE_API_KEY`) are configured in your hosting provider's settings.
