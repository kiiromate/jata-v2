# Work Package C — QA / Security Gate Closure

## Agent Role
QA and security engineer responsible for running the live two-user RLS smoke test, verifying Edge Function auth, and closing the security gate.

## Recommended Tool
**Claude Code** (requires Supabase MCP for live SQL execution and log inspection).

## Phase
**Phase 1** — Start immediately. No dependencies on other agents.

## Branch
```
git checkout -b test/security-gate-closure
```

## MCP Tools Available
- **Supabase MCP** — `execute_sql`, `get_logs`, `get_advisors`, `list_tables`
- **brave-search** — for RLS testing patterns if needed

---

## Repo Context

JATA v2 is a job application system using Supabase for auth, database, storage, and Edge Functions.

### Security state
- RLS hardening migration `20260508002454_security_rls_hardening.sql` has been applied.
- 10 patched Edge Functions deployed: `ai-generate`, `applications-create`, `applications-read`, `applications-update`, `applications-delete`, `capture-inbox`, `delete-user`, `resumes-create`, `save-application-analysis`, `scrape-url`.
- 5/5 static regression tests pass (`scripts/security-rls.test.mjs`).
- `telegram-intake` NOT deployed (missing secrets — not a blocker).
- **Security gate is Yellow.** The only remaining gate item is the live two-user RLS smoke test.

### Key tables with RLS
```
applications    — user_id scoped, CRUD policies
resumes         — user_id scoped, CRUD policies  
users           — user_id scoped
scrape_configs  — user_id scoped
ai_outputs      — user_id scoped
feedback        — user_id scoped insert, no cross-read
contact_submissions — insert only, no read
```

### Existing test scripts
```
scripts/security-rls.test.mjs      — Static RLS policy analysis
scripts/data-durability.test.mjs   — Data integrity checks
scripts/data-integrity-check.mjs   — Additional integrity verification
```

---

## File Ownership (ONLY touch these files)

```
scripts/                    ← New test files only
docs/                       ← Test result documentation only
```

**Do NOT touch:** `apps/`, `packages/`, `supabase/functions/`, `supabase/migrations/`.

---

## Task 1: Live Two-User RLS Smoke Test

### Why this matters
Static tests verify that RLS policies exist and have the right structure. But they cannot verify that one user's data is actually invisible to another user at runtime. This test must run against the live Supabase database with two real user accounts.

### Prerequisites
You need two test user accounts in the JATA Supabase instance. If they don't exist, create them via Supabase Auth dashboard or the MCP.

### Test plan

**Test 1: Application isolation**
1. Sign in as User A.
2. Create an application (insert into `applications`).
3. Verify User A can read their own application.
4. Sign in as User B.
5. Attempt to read User A's application (query `applications` where `id` = User A's application ID).
6. **Expected: User B gets zero rows, not an error. The row is invisible.**
7. Attempt to update User A's application.
8. **Expected: Zero rows affected.**
9. Attempt to delete User A's application.
10. **Expected: Zero rows affected.**

**Test 2: Resume isolation**
1. Sign in as User A.
2. Create a resume record (insert into `resumes`).
3. Sign in as User B.
4. Attempt to read User A's resume.
5. **Expected: Zero rows.**

**Test 3: AI output isolation**
1. Sign in as User A.
2. If User A has any rows in `ai_outputs`, verify they are visible.
3. Sign in as User B.
4. Query `ai_outputs` — should only see User B's own rows (or zero if none exist).
5. **Expected: No cross-user data leakage.**

**Test 4: Edge Function auth**
1. Call each CRUD Edge Function without an auth token.
2. **Expected: 401 Unauthorized for all of them.**
3. Call each Edge Function with User A's token.
4. **Expected: Success for User A's own data.**
5. Call an Edge Function with User A's token but referencing User B's data.
6. **Expected: Empty result or forbidden, not User B's data.**

### Implementation

You can run these tests via:
- Supabase MCP `execute_sql` tool (for direct SQL tests)
- A test script in `scripts/live-rls-smoke-test.mjs` (for reproducibility)
- cURL or Postman against Edge Function URLs (for auth tests)

If writing a script:

```javascript
// scripts/live-rls-smoke-test.mjs
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Test with User A credentials
const userA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
await userA.auth.signInWithPassword({ email: 'test-user-a@...', password: '...' });

// Test with User B credentials  
const userB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
await userB.auth.signInWithPassword({ email: 'test-user-b@...', password: '...' });

// Insert as User A
const { data: app } = await userA.from('applications').insert({
  job_title: 'RLS Test Application',
  company_name: 'RLS Test Corp',
  status: 'Saved',
}).select().single();

// Attempt read as User B
const { data: leaked } = await userB.from('applications').select().eq('id', app.id);
assert(leaked.length === 0, 'CRITICAL: User B can see User A application!');

// Clean up
await userA.from('applications').delete().eq('id', app.id);
```

**IMPORTANT:** Use test data clearly labeled as "RLS Test" so it can be identified and cleaned up. Delete test data after the test completes.

### Acceptance criteria
- [ ] All four test categories pass (applications, resumes, ai_outputs, Edge Function auth)
- [ ] No cross-user data leakage detected
- [ ] Test results are documented with specific pass/fail per test
- [ ] Test data is cleaned up after the test
- [ ] If any test fails: document the failure, do NOT attempt to fix it in this work package (report it for Agent D or a dedicated security fix)

---

## Task 2: Document Security Gate Verdict

Create or update `docs/SECURITY_GATE_VERDICT.md`:

```markdown
# Security Gate Verdict

## Date: YYYY-MM-DD

## Verdict: [GREEN / YELLOW / RED]

## Tests Run
| Test | Result | Notes |
|------|--------|-------|
| Static RLS analysis (security-rls.test.mjs) | PASS/FAIL | |
| Live RLS: Application isolation | PASS/FAIL | |
| Live RLS: Resume isolation | PASS/FAIL | |
| Live RLS: AI output isolation | PASS/FAIL | |
| Edge Function auth (no token) | PASS/FAIL | |
| Edge Function auth (cross-user) | PASS/FAIL | |

## Open Items
- [ ] Item 1
- [ ] Item 2

## Recommendation
[Can proceed to production / Needs fixes first / Blocked]
```

### Verdict rules
- **GREEN:** All tests pass. Safe for production release.
- **YELLOW:** Static tests pass but live tests reveal non-critical issues. Safe for controlled testing only.
- **RED:** Live tests reveal data leakage. Block all deployments until fixed.

---

## Validation

```powershell
# Run existing static tests first
node --test scripts/security-rls.test.mjs
node --test scripts/data-durability.test.mjs

# Then run your live smoke test
node scripts/live-rls-smoke-test.mjs
```

---

## Git Discipline

- Stage only files in `scripts/` and `docs/`.
- Never stage `.env`, `.mcp.json`, `.claude/`, `node_modules/`, `dist/`.
- Commit message format: `test(security): <what changed>`
- **Do not commit test user credentials.** Use environment variables.

---

## Report When Done

Provide:
1. Branch name
2. Commit hashes
3. Files changed
4. Complete test results table
5. Security gate verdict (GREEN / YELLOW / RED)
6. Any issues found and their severity
7. Recommendation for next steps

---

## Do NOT

- Do not modify any application code (apps/, packages/, supabase/functions/)
- Do not modify RLS policies or migrations (report issues only)
- Do not create permanent test user accounts with real email addresses
- Do not commit test credentials or API keys
- Do not attempt to fix security issues found — document and report them
- Do not deploy any Edge Functions
- Do not modify existing test scripts in `scripts/`
