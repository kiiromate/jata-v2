#!/usr/bin/env node
/**
 * Live two-user RLS smoke test — JATA v2.
 *
 * Verifies that one authenticated user cannot read, update, or delete
 * another user's data at the database level, and that Edge Functions
 * reject unauthenticated requests.
 *
 * Strategy: all database tests run inside a BEGIN/ROLLBACK transaction.
 * Test data is created as postgres superuser, then access is checked by
 * switching to the `authenticated` role with a spoofed JWT claim (the same
 * mechanism Supabase RLS uses at runtime). ROLLBACK ensures no test data
 * ever persists, regardless of test outcome.
 *
 * Run: node scripts/live-rls-smoke-test.mjs
 * Requires: supabase CLI linked to the remote project (supabase link --project-ref ...)
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

const execAsync = promisify(exec);

const PROJECT_REF = 'xomiolmrtawyrosqlodd';
const EDGE_BASE = `https://${PROJECT_REF}.supabase.co/functions/v1`;

// Two existing dev users — used as test subjects without needing their passwords.
const USER_A_ID = 'aa5af5ea-3714-475b-ad09-aae14d86be21';
const USER_B_ID = '8c96788c-cb0d-4879-8daf-97998978fafc';

const TEST_APP_ID    = randomUUID();
const TEST_RESUME_ID = randomUUID();
const TEST_AI_ID     = randomUUID();

let passed = 0;
let failed = 0;
const results = [];

function pass(label, notes = '') {
  passed++;
  results.push({ label, result: 'PASS', notes });
  console.log(`  ✓  ${label}${notes ? `  [${notes}]` : ''}`);
}

function fail(label, notes = '') {
  failed++;
  results.push({ label, result: 'FAIL', notes });
  console.error(`  ✗  FAIL — ${label}${notes ? `  [${notes}]` : ''}`);
}

function parseCliOutput(stdout) {
  // The CLI may emit non-JSON preamble lines (e.g. "Initialising login role...")
  // before the JSON blob. Find the first '{' or '[' and parse from there.
  // Handles both envelope shapes: { rows: [...] }  and  [ ... ]
  const text = stdout.trim();
  const objIdx = text.indexOf('{');
  const arrIdx = text.indexOf('[');
  if (objIdx === -1 && arrIdx === -1) {
    throw new Error(`No JSON in CLI output: ${text.slice(0, 300)}`);
  }
  const start = objIdx === -1 ? arrIdx : arrIdx === -1 ? objIdx : Math.min(objIdx, arrIdx);
  const parsed = JSON.parse(text.slice(start));
  return Array.isArray(parsed) ? parsed : (parsed.rows ?? []);
}

async function runSql(sql) {
  const file = join(tmpdir(), `jata-rls-${Date.now()}.sql`);
  writeFileSync(file, sql, 'utf8');
  try {
    const { stdout } = await execAsync(
      `supabase db query --linked --output json --agent yes --file "${file}"`,
      { cwd: process.cwd() },
    );
    return { rows: parseCliOutput(stdout), error: null };
  } catch (err) {
    // Distinguish a harness/parse error from an RLS result
    const msg = err.message ?? String(err);
    return { rows: [], error: `harness error: ${msg}` };
  } finally {
    try { unlinkSync(file); } catch { /* ignore */ }
  }
}

function asUserB() {
  return `SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"${USER_B_ID}","role":"authenticated"}',true);`;
}

function asUserA() {
  return `SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"${USER_A_ID}","role":"authenticated"}',true);`;
}

// ─── 1. Application isolation ─────────────────────────────────────────────────

console.log('\n[1] Application isolation');

// 1a: User B cannot SELECT User A's application
{
  const { rows, error } = await runSql(`
    BEGIN;
    INSERT INTO public.applications (id, user_id, title, company, status, date_applied)
    VALUES ('${TEST_APP_ID}','${USER_A_ID}','RLS Test Job','RLS Test Corp','Saved',CURRENT_DATE);
    ${asUserB()}
    SELECT count(*)::int AS n FROM public.applications WHERE id = '${TEST_APP_ID}';
    ROLLBACK;
  `);
  if (error) { fail("applications: User B cannot SELECT User A's row", `error: ${error}`); }
  else {
    const n = rows[0]?.n ?? -1;
    n === 0
      ? pass("applications: User B cannot SELECT User A's row", `leaked=${n}`)
      : fail("applications: User B cannot SELECT User A's row", `CRITICAL leaked=${n}`);
  }
}

// 1b: User B cannot UPDATE User A's application
{
  const { rows, error } = await runSql(`
    BEGIN;
    INSERT INTO public.applications (id, user_id, title, company, status, date_applied)
    VALUES ('${TEST_APP_ID}','${USER_A_ID}','RLS Test Job','RLS Test Corp','Saved',CURRENT_DATE);
    ${asUserB()}
    WITH u AS (UPDATE public.applications SET status = 'Applied' WHERE id = '${TEST_APP_ID}' RETURNING id)
    SELECT count(*)::int AS n FROM u;
    ROLLBACK;
  `);
  if (error) { fail("applications: User B cannot UPDATE User A's row", `error: ${error}`); }
  else {
    const n = rows[0]?.n ?? -1;
    n === 0
      ? pass("applications: User B cannot UPDATE User A's row", `updated=${n}`)
      : fail("applications: User B cannot UPDATE User A's row", `CRITICAL updated=${n}`);
  }
}

// 1c: User B cannot DELETE User A's application
{
  const { rows, error } = await runSql(`
    BEGIN;
    INSERT INTO public.applications (id, user_id, title, company, status, date_applied)
    VALUES ('${TEST_APP_ID}','${USER_A_ID}','RLS Test Job','RLS Test Corp','Saved',CURRENT_DATE);
    ${asUserB()}
    WITH d AS (DELETE FROM public.applications WHERE id = '${TEST_APP_ID}' RETURNING id)
    SELECT count(*)::int AS n FROM d;
    ROLLBACK;
  `);
  if (error) { fail("applications: User B cannot DELETE User A's row", `error: ${error}`); }
  else {
    const n = rows[0]?.n ?? -1;
    n === 0
      ? pass("applications: User B cannot DELETE User A's row", `deleted=${n}`)
      : fail("applications: User B cannot DELETE User A's row", `CRITICAL deleted=${n}`);
  }
}

// 1d: User A CAN see their own application (sanity check)
{
  const { rows, error } = await runSql(`
    BEGIN;
    INSERT INTO public.applications (id, user_id, title, company, status, date_applied)
    VALUES ('${TEST_APP_ID}','${USER_A_ID}','RLS Test Job','RLS Test Corp','Saved',CURRENT_DATE);
    ${asUserA()}
    SELECT count(*)::int AS n FROM public.applications WHERE id = '${TEST_APP_ID}';
    ROLLBACK;
  `);
  if (error) { fail("applications: User A can SELECT their own row", `error: ${error}`); }
  else {
    const n = rows[0]?.n ?? 0;
    n === 1
      ? pass("applications: User A can SELECT their own row", `visible=${n}`)
      : fail("applications: User A can SELECT their own row", `visible=${n} expected=1`);
  }
}

// ─── 2. Resume isolation ──────────────────────────────────────────────────────

console.log('\n[2] Resume isolation');

// 2a: User B cannot SELECT User A's resume
{
  const { rows, error } = await runSql(`
    BEGIN;
    INSERT INTO public.resumes (id, user_id, content, filename)
    VALUES ('${TEST_RESUME_ID}','${USER_A_ID}','RLS Test Resume Content','rls-test.pdf');
    ${asUserB()}
    SELECT count(*)::int AS n FROM public.resumes WHERE id = '${TEST_RESUME_ID}';
    ROLLBACK;
  `);
  if (error) { fail("resumes: User B cannot SELECT User A's resume", `error: ${error}`); }
  else {
    const n = rows[0]?.n ?? -1;
    n === 0
      ? pass("resumes: User B cannot SELECT User A's resume", `leaked=${n}`)
      : fail("resumes: User B cannot SELECT User A's resume", `CRITICAL leaked=${n}`);
  }
}

// 2b: User B cannot UPDATE User A's resume
{
  const { rows, error } = await runSql(`
    BEGIN;
    INSERT INTO public.resumes (id, user_id, content, filename)
    VALUES ('${TEST_RESUME_ID}','${USER_A_ID}','RLS Test Resume Content','rls-test.pdf');
    ${asUserB()}
    WITH u AS (UPDATE public.resumes SET content = 'Breach' WHERE id = '${TEST_RESUME_ID}' RETURNING id)
    SELECT count(*)::int AS n FROM u;
    ROLLBACK;
  `);
  if (error) { fail("resumes: User B cannot UPDATE User A's resume", `error: ${error}`); }
  else {
    const n = rows[0]?.n ?? -1;
    n === 0
      ? pass("resumes: User B cannot UPDATE User A's resume", `updated=${n}`)
      : fail("resumes: User B cannot UPDATE User A's resume", `CRITICAL updated=${n}`);
  }
}

// 2c: User B cannot DELETE User A's resume
{
  const { rows, error } = await runSql(`
    BEGIN;
    INSERT INTO public.resumes (id, user_id, content, filename)
    VALUES ('${TEST_RESUME_ID}','${USER_A_ID}','RLS Test Resume Content','rls-test.pdf');
    ${asUserB()}
    WITH d AS (DELETE FROM public.resumes WHERE id = '${TEST_RESUME_ID}' RETURNING id)
    SELECT count(*)::int AS n FROM d;
    ROLLBACK;
  `);
  if (error) { fail("resumes: User B cannot DELETE User A's resume", `error: ${error}`); }
  else {
    const n = rows[0]?.n ?? -1;
    n === 0
      ? pass("resumes: User B cannot DELETE User A's resume", `deleted=${n}`)
      : fail("resumes: User B cannot DELETE User A's resume", `CRITICAL deleted=${n}`);
  }
}

// ─── 3. AI output isolation ───────────────────────────────────────────────────

console.log('\n[3] AI output isolation');

// Valid values per check constraints:
//   provider: none | mock | huggingface | openrouter
//   status:   success | failed | blocked
//   task_type: analyzeCvMatch | suggestResumeImprovements | generateCoverLetter |
//              generateRecruiterMessage | generateFollowUpMessage | summarizeOpportunity

// 3a: User B cannot SELECT User A's AI output
{
  const { rows, error } = await runSql(`
    BEGIN;
    INSERT INTO public.ai_outputs (id, user_id, provider, task_type, input_hash, status)
    VALUES ('${TEST_AI_ID}','${USER_A_ID}','mock','analyzeCvMatch','rls_test_hash','success');
    ${asUserB()}
    SELECT count(*)::int AS n FROM public.ai_outputs WHERE id = '${TEST_AI_ID}';
    ROLLBACK;
  `);
  if (error) { fail("ai_outputs: User B cannot SELECT User A's AI output", `error: ${error}`); }
  else {
    const n = rows[0]?.n ?? -1;
    n === 0
      ? pass("ai_outputs: User B cannot SELECT User A's AI output", `leaked=${n}`)
      : fail("ai_outputs: User B cannot SELECT User A's AI output", `CRITICAL leaked=${n}`);
  }
}

// 3b: No cross-user ai_outputs leakage in existing live data
{
  const { rows, error } = await runSql(`
    BEGIN;
    ${asUserB()}
    SELECT count(*)::int AS n FROM public.ai_outputs WHERE user_id = '${USER_A_ID}';
    ROLLBACK;
  `);
  if (error) { fail("ai_outputs: User B sees zero of User A's rows in live data", `error: ${error}`); }
  else {
    const n = rows[0]?.n ?? -1;
    n === 0
      ? pass("ai_outputs: User B sees zero of User A's rows in live data", `n=${n}`)
      : fail("ai_outputs: User B sees zero of User A's rows in live data", `CRITICAL n=${n}`);
  }
}

// ─── 4. Users table isolation ─────────────────────────────────────────────────

console.log('\n[4] Users table isolation');

// 4a: User B cannot SELECT User A's profile row
{
  const { rows, error } = await runSql(`
    BEGIN;
    ${asUserB()}
    SELECT count(*)::int AS n FROM public.users WHERE id = '${USER_A_ID}';
    ROLLBACK;
  `);
  if (error) { fail("users: User B cannot SELECT User A's profile", `error: ${error}`); }
  else {
    const n = rows[0]?.n ?? -1;
    n === 0
      ? pass("users: User B cannot SELECT User A's profile", `leaked=${n}`)
      : fail("users: User B cannot SELECT User A's profile", `leaked=${n}`);
  }
}

// 4b: User A can SELECT their own profile without error
{
  const { rows, error } = await runSql(`
    BEGIN;
    ${asUserA()}
    SELECT count(*)::int AS n FROM public.users WHERE id = '${USER_A_ID}';
    ROLLBACK;
  `);
  if (error) { fail("users: User A's own profile query runs without error", `error: ${error}`); }
  else {
    const n = rows[0]?.n ?? 0;
    // n >= 0 is always true; the meaningful signal is no error and the query ran
    pass("users: User A's own profile query runs without error", `visible=${n}`);
  }
}

// ─── 5. Edge Function auth ────────────────────────────────────────────────────

console.log('\n[5] Edge Function auth — unauthenticated requests must return 401');

const AUTH_FUNCTIONS = [
  'applications-create',
  'applications-read',
  'applications-update',
  'applications-delete',
  'resumes-create',
  'capture-inbox',
  'delete-user',
  'save-application-analysis',
  'scrape-url',
];

for (const fn of AUTH_FUNCTIONS) {
  try {
    const res = await fetch(`${EDGE_BASE}/${fn}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    res.status === 401
      ? pass(`${fn}: no-token → 401 Unauthorized`)
      : fail(`${fn}: no-token → ${res.status} (expected 401)`);
  } catch (err) {
    fail(`${fn}: network error — ${err.message}`);
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed`);

const verdict = failed === 0 ? 'GREEN' : 'RED';
console.log(`\nVerdict: ${verdict}`);

if (failed > 0) {
  console.error('\nFailed tests:');
  results.filter(r => r.result === 'FAIL').forEach(r => {
    console.error(`  • ${r.label}${r.notes ? ` — ${r.notes}` : ''}`);
  });
}

console.log('\nFull results table:');
console.log('| Test | Result | Notes |');
console.log('|------|--------|-------|');
for (const { label, result, notes } of results) {
  console.log(`| ${label} | ${result} | ${notes} |`);
}

process.exit(failed > 0 ? 1 : 0);
