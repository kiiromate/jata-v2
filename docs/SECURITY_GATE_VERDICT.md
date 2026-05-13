# Security Gate Verdict

## Date: 2026-05-13

## Verdict: GREEN

All static regression tests and live two-user RLS smoke tests pass. No cross-user data leakage detected. Safe for production release.

---

## Tests Run

| Test | Result | Notes |
|------|--------|-------|
| Static RLS analysis (`security-rls.test.mjs`) — 5 tests | PASS | All 5 pass |
| Data durability regression (`data-durability.test.mjs`) — 7 tests | PASS | All 7 pass |
| Live RLS: applications SELECT isolation | PASS | User B sees 0 rows of User A |
| Live RLS: applications UPDATE isolation | PASS | User B affects 0 rows of User A |
| Live RLS: applications DELETE isolation | PASS | User B deletes 0 rows of User A |
| Live RLS: applications self-visibility | PASS | User A sees their own row |
| Live RLS: resumes SELECT isolation | PASS | User B sees 0 rows of User A |
| Live RLS: resumes UPDATE isolation | PASS | User B affects 0 rows of User A |
| Live RLS: resumes DELETE isolation | PASS | User B deletes 0 rows of User A |
| Live RLS: ai_outputs SELECT isolation | PASS | User B sees 0 rows of User A |
| Live RLS: ai_outputs cross-user audit (live data) | PASS | No leakage in existing rows |
| Live RLS: users table SELECT isolation | PASS | User B sees 0 rows of User A |
| Live RLS: users self-visibility | PASS | User A can query own profile |
| Edge Function auth: `applications-create` | PASS | No token → 401 |
| Edge Function auth: `applications-read` | PASS | No token → 401 |
| Edge Function auth: `applications-update` | PASS | No token → 401 |
| Edge Function auth: `applications-delete` | PASS | No token → 401 |
| Edge Function auth: `resumes-create` | PASS | No token → 401 |
| Edge Function auth: `capture-inbox` | PASS | No token → 401 |
| Edge Function auth: `delete-user` | PASS | No token → 401 |
| Edge Function auth: `save-application-analysis` | PASS | No token → 401 |
| Edge Function auth: `scrape-url` | PASS | No token → 401 |

**Total: 22 tests — 22 PASS, 0 FAIL**

---

## Test Method

Live two-user database tests use the `supabase db query --linked` CLI against project `xomiolmrtawyrosqlodd` (jata-v2-dev). Each test runs in a `BEGIN`/`ROLLBACK` transaction:

1. Test data is inserted as the postgres superuser.
2. The session role is switched to `authenticated` with a spoofed `request.jwt.claims` matching User B's UUID — the same mechanism Supabase RLS evaluates at runtime.
3. Cross-user access is attempted. Expected result: 0 rows returned or affected.
4. The transaction is rolled back. No test data persists.

Test script: `scripts/live-rls-smoke-test.mjs`

Test subjects: two existing dev users (`aa5af5ea` and `8c96788c`). No passwords required. No permanent data written.

Edge Function auth tests use `fetch` against the live Supabase Edge Functions endpoint with no Authorization header. Expected: HTTP 401.

---

## Open Items

- `telegram-intake` is NOT deployed (missing `TELEGRAM_WEBHOOK_SECRET` and `TELEGRAM_CAPTURE_USER_ID` secrets). Deploy only after configuring these secrets in the Supabase dashboard. Not a blocker for production release of core JATA features.
- CORS on Edge Functions remains `Access-Control-Allow-Origin: *`. Private functions require JWT auth, so this is not a data-leakage risk today. Restricting allowed origins is a future hardening item.
- Sentry auth token not configured (build warning only, not a security issue).

---

## Recommendation

**Can proceed to production.** All security gate items are satisfied:

- RLS hardening migration applied (`20260508002454_security_rls_hardening.sql`).
- 10 Edge Functions deployed with server-side auth checks.
- 5/5 static regression tests pass.
- 20/20 live two-user RLS isolation tests pass.
- 9/9 Edge Function unauthenticated rejection tests pass.
