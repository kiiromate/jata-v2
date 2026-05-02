# Free Tier Deployment Audit

Date: 2026-05-02
Scope: Recommendation and setup notes only. No deployment was run.

## Recommendation

Use Vercel for the first preview and keep Cloudflare Pages as a follow-up option.

Why Vercel first:

- The repo already has a `vercel.json`, although it needs cleanup.
- The app is a Vite React SPA with a simple static output.
- Vercel supports monorepos and Vite projects.
- Existing extension trust logic already allows `.vercel.app` origins.

Why not Cloudflare Pages first:

- There is no `wrangler.toml` or Cloudflare Pages config in the repo.
- It is still a good free static host, but it adds setup surface while Supabase wiring is the real launch blocker.

Official references checked:

- Vercel Vite docs: https://vercel.com/docs/frameworks/vite
- Vercel monorepo docs: https://vercel.com/docs/monorepos
- Vercel build configuration docs: https://vercel.com/docs/deployments/configure-a-build
- Cloudflare Pages build configuration docs: https://developers.cloudflare.com/pages/configuration/build-configuration/
- Cloudflare Pages monorepo docs: https://developers.cloudflare.com/pages/configuration/monorepos/

## Current Deployment Files

- `vercel.json` exists.
- `netlify.toml` does not exist.
- `wrangler.toml` does not exist.
- `.github/workflows` does not exist.

Current `vercel.json` risk:

- Uses legacy `builds` with `@vercel/static-build`.
- Routes all traffic to `/apps/web/$1`, which is not the normal fallback shape for a Vite SPA.
- Does not clearly provide a fallback rewrite to `/index.html` for client-side routes such as `/dashboard`.

## Vercel Preview Settings

Recommended dashboard settings for first preview:

- Framework preset: Vite or Other with explicit build/output overrides.
- Root directory: repository root.
- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm --filter @jata/web build`
- Output directory: `apps/web/dist`
- Node version: 20 or newer.

Recommended `vercel.json` follow-up:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Only make that change in the P0 fixes branch after verifying how Vercel project settings are configured.

## Cloudflare Pages Follow-Up Settings

Recommended settings if using Cloudflare Pages later:

- Root directory: repository root.
- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm --filter @jata/web build`
- Build output directory: `apps/web/dist`
- Node version: 20 or newer.

Cloudflare Pages needs a SPA fallback, usually through a generated `_redirects` or platform routing setting:

```text
/* /index.html 200
```

Do not add this until Cloudflare Pages is the chosen deploy path.

## Required Preview Env Vars

Required:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Optional:

```env
VITE_SENTRY_DSN=
VITE_PUBLIC_POSTHOG_KEY=
VITE_PUBLIC_POSTHOG_HOST=
SENTRY_AUTH_TOKEN=
```

Do not configure provider API keys in frontend hosting env. Provider keys belong in Supabase Edge Function secrets.

## Sentry Notes

Current build warnings:

- No `SENTRY_AUTH_TOKEN`, so source maps are not uploaded.
- Sentry telemetry message appears during build.

Launch classification:

- Missing `SENTRY_AUTH_TOKEN` can be ignored for first preview.
- `VITE_SENTRY_DSN` can be omitted for first preview if error monitoring is deferred.
- Add Sentry source-map upload later when release tracking matters.

## PostHog Notes

`PostHogProvider` only initializes when both variables are present:

- `VITE_PUBLIC_POSTHOG_KEY`
- `VITE_PUBLIC_POSTHOG_HOST`

Risk:

- `SigninPage` calls `usePostHog().capture('user_signed_in')`. Verify signin works when PostHog env vars are absent.

## Netlify Cleanup Recommendation

There is no `netlify.toml`, but older docs still reference Netlify. If the GitHub repo still has Netlify checks or integrations enabled, disable them for launch to avoid stale failing deploy checks.

Do not delete historical docs in this audit branch. Clean documentation references later in a dedicated docs cleanup branch.

## First Preview Blockers Before Deploy

Do not deploy until these are fixed:

- Application creation schema mismatch.
- Sidebar links to missing routes.
- Hardcoded localhost Edge Function URLs.
- Supabase Auth redirect URLs and env vars not configured.
- Vercel SPA fallback config not confirmed.

## Human Deployment Checklist

1. Fix P0 launch blockers in `fix/p0-launch-core-flow`.
2. Run:

```powershell
pnpm install --frozen-lockfile
pnpm --filter @jata/web build
pnpm --filter @jata/extension build
git status --short
```

3. In Vercel, import `kiiromate/jata-v2`.
4. Set root to repository root.
5. Set install/build/output settings from this doc.
6. Add only required preview env vars.
7. Add Supabase preview URL to Supabase Auth redirect allow list.
8. Deploy preview.
9. Run `docs/QA_CHECKLIST.md`.
