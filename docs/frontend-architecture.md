# JATA Frontend Architecture

**Project Name:** JATA (Job Application Tracker & Optimization App)  
**Version:** 2.0  
**Date:** July 15, 2025  
**Purpose:** This document outlines the frontend architecture for JATA, a job application tracker and optimization app. It provides a detailed guide for developers to build and maintain the frontend, covering structure, tools, components, and best practices while ensuring performance, accessibility, and scalability.

---

## 1. Overview & Goals

The JATA frontend serves as the user interface for a job application tracking and optimization tool. It includes features like resume tailoring, dashboard analytics, web scraper controls, and autofill management, designed to streamline the job application process for users.

### Goals
- **Performance:** Target a bundle size under 200KB for fast load times.
- **Accessibility:** Comply with WCAG 2.1 standards using ARIA roles and keyboard-friendly navigation.
- **Responsiveness:** Ensure seamless operation across mobile, tablet, and desktop devices.

---

## 2. Monorepo Structure

JATA’s frontend resides within a monorepo, enabling code sharing and maintainability.

### Directory Structure
```
packages/
└── frontend/
    ├── src/
    │   ├── components/     # Feature-specific components
    │   ├── hooks/          # Custom React hooks
    │   ├── utils/          # Shared utility functions
    │   ├── pages/          # Page-level components for routing
    │   ├── assets/         # Images, fonts, and other static files
    │   └── App.tsx         # Root application component
    ├── public/             # Static public assets
    ├── vite.config.ts      # Vite build configuration
    ├── tsconfig.json       # TypeScript settings
    └── package.json        # Frontend dependencies
└── ui/
    ├── src/
    │   ├── components/     # Reusable UI components (e.g., buttons, modals)
    │   └── index.ts        # Exports for shared components
    └── package.json        # UI library dependencies
```

- **`packages/frontend/`:** Contains the main application code.
- **`packages/ui/`:** A shared library of reusable UI components, consumed by both the frontend and extension.

---

## 3. Tech Stack & Tooling

The frontend leverages modern, open-source tools for development efficiency and user experience.

- **Framework:** React with TypeScript, built using Vite for fast development and optimized builds.
- **UI:** Tailwind CSS with design tokens for styling, GSAP for micro-animations, and shadcn/ui for pre-built components.
- **State Management:** Zustand (chosen for its lightweight, simple API compared to Redux Toolkit’s boilerplate).
- **Data Fetching:** React Query for efficient server-state management and caching.
- **Visualization:** Recharts for responsive, customizable charts.
- **Testing:** Jest and React Testing Library for unit tests; Playwright for end-to-end testing.
- **Linting & Formatting:** ESLint for code quality and Prettier for consistent formatting.

---

## 4. Component Catalog

Key components drive JATA’s core features, each with defined responsibilities and accessibility considerations.

| **Component**       | **Location**                     | **Props**                          | **State Needs**       | **Accessibility**             |
|---------------------|----------------------------------|------------------------------------|-----------------------|-------------------------------|
| `DashboardChart`    | `src/components/DashboardChart.tsx` | `data`, `chartType`                | Global (analytics)    | ARIA labels for chart elements |
| `UploadForm`        | `src/components/UploadForm.tsx`     | `onUpload`, `acceptedFormats`      | Local (file progress) | Keyboard support for file input |
| `ScraperPopup`      | `src/components/ScraperPopup.tsx`   | `onScrape`, `mappingConfig`        | Global (scraper data) | Modal with focus trapping     |
| `AutofillToggle`    | `src/components/AutofillToggle.tsx` | `isEnabled`, `onToggle`            | Global (settings)     | ARIA toggle state             |
| `MappingModal`      | `src/components/MappingModal.tsx`   | `mappings`, `onSave`, `onCancel`   | Local (form data)     | ARIA-labeled form fields      |

- **Props & Data Flow:** Components receive data via props; global state is accessed through Zustand.
- **State Needs:** Local state is managed within components; global state handles cross-component data.

---

## 5. Routing & Navigation

React Router v6 powers client-side navigation with a clear route structure.

### Routes
- `/`: Landing page.
- `/dashboard`: Analytics dashboard.
- `/applications`: Application tracking list.
- `/settings`: User settings and preferences.
- `/resume-tailor`: Resume optimization tool.

### Example
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/applications" element={<ApplicationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/resume-tailor" element={<ResumeTailorPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 6. State Management

Zustand manages global state with a simple, performant store.

### Store Shape
```typescript
interface JATAState {
  applications: Application[];
  userProfile: UserProfile;
  scraperConfig: ScraperConfig;
  bulkJobs: BulkJob[];
  autofillMappings: Mapping[];
  setApplications: (apps: Application[]) => void;
  setUserProfile: (profile: UserProfile) => void;
  // Additional setters...
}
```

- **Persistence:** Uses `localStorage` for non-sensitive data and `chrome.storage` for extension-specific data.
- **Hydration:** State is initialized from storage or API on app load.

---

## 7. Styling & Theming

Tailwind CSS provides utility-first styling with a custom design system.

### Tailwind Config
```javascript
module.exports = {
  content: ['./src/**/*.{tsx,html}'],
  theme: {
    extend: {
      colors: {
        'cool-gray': '#D3D7D9',
        'pure-white': '#FFFFFF',
        'soft-olive': '#A3BFFA',
        'jet-black': '#1C2526',
        'light-gray': '#E5E7EB',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

- **Theming:** Dark/light mode toggling via `dark:` prefix and user settings.
- **Patterns:** Example class usage: `className="bg-cool-gray text-jet-black p-4"`.

---

## 8. Utilities & Hooks

Custom utilities and hooks enhance functionality and reusability.

### Custom Hooks
- `useApi`: Manages API requests with React Query.
- `useCsvParser`: Parses CSV uploads.
- `usePdfExtraction`: Extracts text from PDFs.
- `useScrape`: Controls scraping operations.
- `useAutofill`: Handles autofill logic.

### Helper Functions
- `formatDate`: Standardizes date display.
- `calculateMetrics`: Computes dashboard analytics.

---

## 9. Extension Integration Points

The frontend integrates with a browser extension for enhanced functionality.

- **Popup UI:** Rendered as a React app, communicates with the background via `chrome.runtime.sendMessage`.
- **Content Script:** Injects scraper and autofill UI, relaying data to the popup.
- **Messaging:** Uses JSON messages (e.g., `{ action: 'scrape', payload: { url } }`).

---

## 10. Performance & Optimization

Optimization ensures a lightweight, fast frontend.

- **Code-Splitting:** Lazy load routes like `/settings` with `React.lazy`.
- **Bundle Analysis:** Monitor size with `rollup-plugin-visualizer`.
- **Caching:** React Query caches API responses for 5 minutes.

---

## 11. Testing Strategy

Testing ensures reliability across features.

- **Unit Tests:** Test components with Jest and React Testing Library.
- **E2E Tests:** Use Playwright to test flows like “apply → track → analytics”.
- **Mocking:** Simulate extension messages with `jest-chrome`.

---

## 12. CI/CD & Deployment

Automated workflows streamline development and deployment.

- **VSCode Settings:** Shared `.vscode/settings.json` for consistency.
- **NPM Scripts:**
  - `dev`: Runs Vite dev server.
  - `build`: Creates production build.
  - `lint`: Runs ESLint.
  - `test`: Executes test suite.
- **Deployment:** Hosted on Netlify with `netlify.toml` for redirects.

---

## 13. Appendix

### Component Skeleton
```tsx
import React from 'react';

interface Props {
  exampleProp: string;
}

const MyComponent: React.FC<Props> = ({ exampleProp }) => {
  return <div className="p-4">{exampleProp}</div>;
};

export default MyComponent;
```

### Hook Template
```tsx
import { useState } from 'react';

export const useMyHook = () => {
  const [value, setValue] = useState('');
  return { value, setValue };
};
```

### Reference Links
- [React](https://reactjs.org)
- [Tailwind CSS](https://tailwindcss.com)
- [Zustand](https://zustand-demo.pmnd.rs)
- [React Query](https://tanstack.com/query)
- [Recharts](https://recharts.org)
- [Playwright](https://playwright.dev)

---

**Summary:** This document details JATA’s frontend architecture, including its monorepo structure (packages/frontend and ui), tech stack (React, TypeScript, Vite, Tailwind, Zustand), component catalog, routing, state management, styling, custom hooks, extension integration, performance strategies, testing, and deployment processes. It serves as a complete resource for developers to build and maintain the frontend efficiently.