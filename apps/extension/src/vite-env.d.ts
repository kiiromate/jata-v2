/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_JATA_WEB_APP_URL?: string
  readonly VITE_VERCEL_BRANCH_URL?: string
  readonly VITE_VERCEL_URL?: string
  readonly VITE_VERCEL_PROJECT_PRODUCTION_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
