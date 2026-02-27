---
inclusion: always
---

# Project Structure

## Monorepo Layout

```
jata/
├── apps/                    # Application packages
│   ├── web/                # Main React dashboard
│   ├── extension/          # Browser extension
│   └── api/                # Supabase Edge Functions
├── packages/               # Shared packages
│   ├── common/            # Shared utilities and types
│   └── ui/                # Shared UI components
├── supabase/              # Supabase configuration
├── turbo.json             # Turborepo configuration
├── pnpm-workspace.yaml    # pnpm workspace definition
└── package.json           # Root package scripts
```

## Apps Directory

### apps/web
Main web application with React + Vite.

Key directories:
- `src/pages/`: Page components (Dashboard, ResumeTailorPage, etc.)
- `src/services/`: API and service modules (aiService.ts, Supabase client)
- `src/components/`: Reusable React components
- `src/`: Root-level App.tsx with routing

Configuration:
- `vite.config.ts`: Vite build configuration
- `tailwind.config.js`: Tailwind CSS customization
- `tsconfig.json`: TypeScript settings
- `.eslintrc.cjs`: ESLint rules

### apps/extension
Browser extension for job description scraping.

Key files:
- `manifest.json`: Extension manifest (V3)
- `src/`: Extension source code
- `dist/`: Build output (load this in browser)

### apps/api
Supabase Edge Functions (serverless Deno functions).

Typical functions:
- URL scraping
- Resume parsing
- Application analysis

## Packages Directory

### packages/common
Shared utilities and type definitions.

- `src/database.types.ts`: Generated Supabase types
- `types/`: Common TypeScript types
- `index.ts`: Package exports

### packages/ui
Shared UI components (if needed across apps).

## Workspace Dependencies

All workspace packages use the `workspace:^` protocol for internal dependencies.

Example: `"@jata/common": "workspace:^"`

## Naming Conventions

- Package names: `@jata/[package-name]`
- Component files: PascalCase (e.g., `ResumeTailorPage.tsx`)
- Service files: camelCase (e.g., `aiService.ts`)
- Config files: kebab-case or standard names

## Build Outputs

- Web app: `apps/web/dist/`
- Extension: `apps/extension/dist/`
- Turbo cache: `.turbo/` in each package

## Important Files

- `sherif.config.ts`: Enforces React 18.x across all packages
- `turbo.json`: Defines build pipeline and caching strategy
- Root `.env`: Global environment variables
- `apps/web/.env`: Web-specific environment variables
