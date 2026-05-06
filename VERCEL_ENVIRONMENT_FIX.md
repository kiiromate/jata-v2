# Vercel Environment Configuration Fix for Supabase Auth

## Problem
Production authentication (https://jata-app.vercel.app/signin) was failing with `Failed to fetch` due to incorrect Supabase project URL in the built production app.

The app was attempting to reach: `fexqifjbwknelvnxjxjs.supabase.co` (wrong project)
But should reach: `xomiolmrtawyrosqlodd.supabase.co` (correct project)

## Root Cause
Vite embeds environment variables prefixed with `VITE_` at build time. If Vercel environment variables are not set, the app has no Supabase configuration and fails authentication.

## Code Changes
1. ✅ Fixed `apps/web/package.json` - updated `gen:types` script to use correct Supabase project ID `xomiolmrtawyrosqlodd`
2. ✅ Added startup guard in `apps/web/src/lib/supabaseClient.ts` to log missing environment variables

## Required Vercel Environment Variables

Set these variables in **Vercel Dashboard** → Project Settings → Environment Variables:

For **all environments** (Production, Preview, Development):

| Variable Name | Value | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://xomiolmrtawyrosqlodd.supabase.co` | Browser-safe URL, publicly visible |
| `VITE_SUPABASE_ANON_KEY` | `{your-supabase-anon-key}` | Get from Supabase project settings (public key, safe to expose) |

## Steps to Fix in Vercel

1. Go to https://vercel.com/dashboard
2. Select the JATA project
3. Click **Settings** → **Environment Variables**
4. For each variable above:
   - Add or update `VITE_SUPABASE_URL`
   - Add or update `VITE_SUPABASE_ANON_KEY`
5. **Important**: Set these for all three environments:
   - Production
   - Preview
   - Development
6. After updating environment variables, **trigger a fresh deployment** from the Vercel dashboard
   - Click **Deployments**
   - Find the latest commit
   - Click the three dots and select **Redeploy**
   - **DO NOT** skip this step — Vite embeds env vars at build time

## Verification After Deployment

1. Open https://jata-app.vercel.app/signin
2. Open DevTools → Network tab
3. Attempt to sign in
4. Look for requests to `xomiolmrtawyrosqlodd.supabase.co` (not `fexqifjbwknelvnxjxjs.supabase.co`)
5. Verify:
   - ✅ Auth requests go to correct Supabase project
   - ✅ Sign in works
   - ✅ Sign up works (or Supabase rate limit/email confirmation is expected)
   - ✅ Session persists on page refresh
   - ✅ Logout works

## Where to Get Supabase Credentials

If you don't have the Supabase credentials:

1. Go to https://app.supabase.com
2. Select your project `xomiolmrtawyrosqlodd`
3. Click **Settings** → **API**
4. Find:
   - **Project URL**: `https://xomiolmrtawyrosqlodd.supabase.co` (copy for `VITE_SUPABASE_URL`)
   - **anon public key**: Copy for `VITE_SUPABASE_ANON_KEY` (this is safe to expose in frontend)

⚠️ Do NOT use the `service_role key` — that's for backend only.

## Important Notes

- **Vite embeds env vars at build time**: Changing Vercel env vars requires a fresh deployment to take effect
- **VITE_ prefix is mandatory**: These variables will be stripped of `VITE_` prefix and embedded in the built JS
- **Frontend credentials are safe**: The anon key is meant for frontend use and cannot modify data beyond RLS policies
- **Never commit .env files**: Keep credentials in Vercel environment only

## Troubleshooting

If auth still fails after following these steps:

1. Check browser console for error details
2. Verify Vercel deployment completed successfully
3. Clear browser cache/local storage: `localStorage.clear()` in console
4. Check Supabase RLS policies allow `anon` user to:
   - Call `auth.v1/token` endpoint
   - Access profiles table (if profile loading is needed)
5. Run `/diagnostic` in the app (if accessible) to see environment status
