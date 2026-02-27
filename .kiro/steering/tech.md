---
inclusion: always
---

# Tech Stack & Build System

## Monorepo Structure

JATA uses a **pnpm workspace** monorepo managed by **Turborepo** for efficient builds and caching.

Package manager: `pnpm@9.4.0` (required)
Node version: `>=20.0.0`

## Frontend Stack

- **React 18**: UI library
- **Vite**: Build tool and dev server
- **TypeScript 5.5**: Type safety with strict mode enabled
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Component library built on Radix UI
- **Zustand**: State management
- **TanStack Query**: Server state and data fetching
- **React Router**: Client-side routing
- **Framer Motion & GSAP**: Animations

## Backend Stack

- **Supabase**: Backend-as-a-Service
  - PostgreSQL database
  - Edge Functions (Deno/TypeScript)
  - Authentication
- **Hugging Face API**: AI model integration for resume analysis

## Browser Extension

- **Manifest V3**: Modern extension architecture
- **Vite**: Build tooling
- **React**: UI components

## Code Quality Tools

- **ESLint**: Linting with TypeScript plugin
- **Prettier**: Code formatting
- **Sherif**: Dependency version consistency across workspace
- **TypeScript**: Strict mode with unused variable checks

## Common Commands

### Development
```bash
pnpm dev              # Start all apps in dev mode
pnpm build            # Build all apps
pnpm lint             # Lint all packages
pnpm format           # Format code with Prettier
```

### Supabase
```bash
supabase start        # Start local Supabase
supabase db push      # Apply migrations
supabase functions deploy  # Deploy edge functions
```

### Web App (apps/web)
```bash
cd apps/web
pnpm dev              # Dev server (usually localhost:5173)
pnpm build            # Production build
pnpm gen:types        # Generate Supabase types
```

### Extension (apps/extension)
```bash
cd apps/extension
pnpm build            # Build extension (load dist/ folder in browser)
```

## Environment Variables

Required in `apps/web/.env`:
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- `VITE_HUGGING_FACE_API_KEY`: Hugging Face API token

## TypeScript Configuration

- Target: ES2020
- Module: ESNext with bundler resolution
- Strict mode enabled
- No unused locals/parameters
- Force consistent casing in filenames
