# JATA v2 API Testing (Postman)

This guide explains how to test the JATA v2 Supabase backend and Edge Functions using Postman.

## Setup

1. Import the collection: `postman/JATA-v2-launch.postman_collection.json`
2. Import the environment: `postman/JATA-v2-local.postman_environment.json`
3. Set your `USER_ACCESS_TOKEN` in the environment variables after signing in.

## Test Flows

### 1. Auth & Profile
- **Get Session**: Use the frontend to sign in and extract the JWT from localStorage (`sb-xomiolmrtawyrosqlodd-auth-token`).
- **Get Profile**: `GET {{SUPABASE_URL}}/rest/v1/profiles`

### 2. Applications
- **List Applications**: `GET {{SUPABASE_URL}}/rest/v1/applications`
- **Create Application**: `POST {{SUPABASE_URL}}/rest/v1/applications`

### 3. Edge Functions (AI & Scraper)
- **Scrape URL**: `POST {{SUPABASE_URL}}/functions/v1/scrape-url`
- **AI Generate**: `POST {{SUPABASE_URL}}/functions/v1/ai-generate` (uses mock provider by default; set `JATA_AI_PROVIDER=none` for no-AI fallback mode)

## Security
- Never commit real JWTs to the repo.
- Use placeholders for sensitive keys.
