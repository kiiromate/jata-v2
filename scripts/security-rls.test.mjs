import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();

function readRepoFile(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function readMigrations() {
  const dir = path.join(repoRoot, 'supabase', 'migrations');
  return readdirSync(dir)
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .map((file) => ({
      file,
      sql: readFileSync(path.join(dir, file), 'utf8'),
    }));
}

function combinedMigrations() {
  return readMigrations().map(({ sql }) => sql).join('\n\n');
}

test('applications and scrape_configs update policies keep new rows owner scoped', () => {
  const sql = combinedMigrations();

  for (const table of ['applications', 'scrape_configs']) {
    assert.match(
      sql,
      new RegExp(
        `CREATE POLICY "Users can update their own ${table === 'applications' ? 'applications' : 'scrape configs'}"[\\s\\S]+ON "?public"?\\."?${table}"?[\\s\\S]+FOR UPDATE[\\s\\S]+USING \\(\\(auth\\.uid\\(\\) = user_id\\)\\)[\\s\\S]+WITH CHECK \\(\\(auth\\.uid\\(\\) = user_id\\)\\)`,
        'i',
      ),
      `${table} update policy must include USING and WITH CHECK owner guards`,
    );
  }
});

test('delete-user derives deletion target from verified JWT only', () => {
  const source = readRepoFile('supabase/functions/delete-user/index.ts');

  assert.doesNotMatch(source, /readUserId|user_id\s*=\s*readUserId|Missing user_id/);
  assert.match(source, /const\s+targetUserId\s*=\s*user\.id/);
  assert.match(source, /\.delete\(\)[\s\S]+\.eq\('user_id',\s*targetUserId\)/);
  assert.match(source, /deleteUser\(targetUserId\)/);
});

test('scrape-url requires authenticated users and rejects unsafe URL targets', () => {
  const source = readRepoFile('supabase/functions/scrape-url/index.ts');

  assert.match(source, /getUserId\(req\)/);
  assert.match(source, /Unauthorized/);
  assert.match(source, /assertSafeHttpUrl/);
  assert.match(source, /isPrivateIpAddress/);
});

test('save-application-analysis verifies selected resume ownership before linking it', () => {
  const source = readRepoFile('supabase/functions/save-application-analysis/index.ts');

  assert.match(source, /selectedResumeId:\s*z\.string\(\)\.uuid\(\)/);
  assert.match(source, /\.from\('resumes'\)[\s\S]+\.eq\('id',\s*selectedResumeId\)[\s\S]+\.eq\('user_id',\s*userId\)/);
  assert.match(source, /Resume not found/);
});

test('extension auth sync does not trust arbitrary Vercel apps', () => {
  const originSource = readRepoFile('apps/extension/src/lib/webAppOrigin.ts');
  const contentSource = readRepoFile('apps/extension/src/contentScripts/scraper.ts');
  const manifest = readRepoFile('apps/extension/manifest.json');

  assert.doesNotMatch(originSource, /TRUSTED_STATIC_ORIGINS\.has\(normalized\)\s*\|\|\s*normalized\.endsWith\('\.vercel\.app'\)/);
  assert.doesNotMatch(contentSource, /event\.origin\.endsWith\('\.vercel\.app'\)/);
  assert.doesNotMatch(manifest, /https:\/\/\*\.vercel\.app\/\*/);
  assert.match(originSource, /isTrustedVercelPreviewOrigin/);
  assert.match(contentSource, /isTrustedVercelPreviewOrigin/);
});
