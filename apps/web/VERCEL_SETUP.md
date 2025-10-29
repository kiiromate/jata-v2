# Vercel Deployment Setup

## Required Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add the following variables for **Production**, **Preview**, and **Development**:

```
VITE_SUPABASE_URL=https://fexqifjbwknelvnxjxjs.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleHFpZmpid2tuZWx2bnhqeGpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMjI0NTgsImV4cCI6MjA2ODg5ODQ1OH0.VK9yoNsJ6Nm8K3rodt8w7Z554_UUcCN6n6lL2htHvHA
VITE_HUGGING_FACE_API_KEY=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
VITE_SENTRY_DSN=https://af1e10e6586db604d22f57a01a5802cc@o4509889188069376.ingest.de.sentry.io/4509889225883728
VITE_PUBLIC_POSTHOG_KEY=phc_zomVhQjeLwDekdR2T9NjVx0ZeSuM6Kx6iZBJT2ULRmy
VITE_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

## Project Settings

- **Root Directory**: `apps/web`
- **Framework Preset**: Vite
- **Build Command**: `cd ../.. && pnpm install && pnpm --filter @jata/web build`
- **Output Directory**: `dist`
- **Install Command**: `pnpm install`

## After Adding Variables

1. Redeploy the project from Vercel dashboard
2. Or push a new commit to trigger automatic deployment

## Troubleshooting

If pages are still blank:
1. Check browser console for errors
2. Verify all environment variables are set
3. Check Vercel build logs for errors
4. Ensure Supabase project is accessible
