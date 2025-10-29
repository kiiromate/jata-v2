# Production Fix - Blank Pages Issue

## Problem
Pages showing blank content after login. Auth works but database queries fail.

## Root Cause
**Row Level Security (RLS) policies** not properly configured in production Supabase database.

## Solution

### Step 1: Run Diagnostic Page
1. Deploy the latest code (already pushed)
2. Sign in to production: https://jata-app.vercel.app/signin
3. Visit: https://jata-app.vercel.app/diagnostic
4. Check which database queries are failing

### Step 2: Apply RLS Policies to Production Database

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to https://supabase.com/dashboard/project/fexqifjbwknelvnxjxjs
2. Click "SQL Editor" in left sidebar
3. Copy and paste the contents of `supabase/migrations/20250130_fix_rls_policies.sql`
4. Click "Run" to execute

**Option B: Via Supabase CLI**
```bash
cd jata
supabase db push --project-ref fexqifjbwknelvnxjxjs
```

### Step 3: Verify Fix
1. Refresh https://jata-app.vercel.app/dashboard
2. Pages should now load with content
3. Check diagnostic page again - all database queries should show ✓ Success

## What the Fix Does
The SQL migration creates RLS policies that allow authenticated users to:
- Read/write their own applications
- Read/update their own profile
- Read/write their own resumes and cover letters
- Insert feedback
- Read/write their own settings

## If Still Not Working
Check browser console (F12) for specific errors and share them.

## Prevention
Always test RLS policies in staging before deploying to production.
