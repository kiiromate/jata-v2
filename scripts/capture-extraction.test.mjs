import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();

function readRepoFile(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function fileExists(relativePath) {
  return existsSync(path.join(repoRoot, relativePath));
}

// ── Adapter registry structure ────────────────────────────────────────────────

test('adapter registry file exists and exports required symbols', () => {
  assert.ok(fileExists('packages/common/src/extraction/adapters/index.ts'), 'adapter index must exist');
  const src = readRepoFile('packages/common/src/extraction/adapters/index.ts');
  assert.match(src, /detectAdapter/, 'must export detectAdapter');
  assert.match(src, /buildExtractionResult/, 'must export buildExtractionResult');
  assert.match(src, /ADAPTERS/, 'must export ADAPTERS');
});

test('all required adapters are present', () => {
  for (const file of [
    'packages/common/src/extraction/adapters/greenhouse.ts',
    'packages/common/src/extraction/adapters/lever.ts',
    'packages/common/src/extraction/adapters/ashby.ts',
    'packages/common/src/extraction/adapters/workday.ts',
    'packages/common/src/extraction/adapters/smartRecruiters.ts',
    'packages/common/src/extraction/adapters/genericJobPage.ts',
    'packages/common/src/extraction/adapters/genericOpportunity.ts',
  ]) {
    assert.ok(fileExists(file), `${file} must exist`);
  }
});

test('each adapter file exports detect, normalize, and confidence', () => {
  const adapterFiles = [
    'packages/common/src/extraction/adapters/greenhouse.ts',
    'packages/common/src/extraction/adapters/lever.ts',
    'packages/common/src/extraction/adapters/ashby.ts',
    'packages/common/src/extraction/adapters/workday.ts',
    'packages/common/src/extraction/adapters/smartRecruiters.ts',
    'packages/common/src/extraction/adapters/genericJobPage.ts',
    'packages/common/src/extraction/adapters/genericOpportunity.ts',
  ];

  for (const file of adapterFiles) {
    const src = readRepoFile(file);
    assert.match(src, /detect\s*\(/, `${file} must define detect`);
    assert.match(src, /normalize\s*\(/, `${file} must define normalize`);
    assert.match(src, /confidence\s*\(/, `${file} must define confidence`);
  }
});

test('genericOpportunity always matches (detect returns true)', () => {
  const src = readRepoFile('packages/common/src/extraction/adapters/genericOpportunity.ts');
  assert.match(src, /return true/, 'genericOpportunity detect must return true unconditionally');
});

test('adapter registry lists genericOpportunity last', () => {
  const src = readRepoFile('packages/common/src/extraction/adapters/index.ts');
  const genericOpportunityPos = src.indexOf('genericOpportunityAdapter');
  const otherAdapters = [
    'greenhouseAdapter',
    'leverAdapter',
    'ashbyAdapter',
    'workdayAdapter',
    'smartRecruitersAdapter',
    'genericJobPageAdapter',
  ];
  for (const adapter of otherAdapters) {
    const pos = src.indexOf(adapter);
    assert.ok(pos !== -1, `${adapter} must appear in ADAPTERS`);
    assert.ok(pos < genericOpportunityPos, `${adapter} must appear before genericOpportunityAdapter in registry`);
  }
});

// ── Confidence scoring structure ──────────────────────────────────────────────

test('confidence module exports required functions', () => {
  assert.ok(fileExists('packages/common/src/extraction/confidence.ts'), 'confidence module must exist');
  const src = readRepoFile('packages/common/src/extraction/confidence.ts');
  assert.match(src, /scoreConfidence/, 'must export scoreConfidence');
  assert.match(src, /classifyConfidence/, 'must export classifyConfidence');
  assert.match(src, /getMissingFields/, 'must export getMissingFields');
  assert.match(src, /getWarnings/, 'must export getWarnings');
});

test('confidence thresholds are set to 0.80 strong and 0.55 review_recommended', () => {
  const src = readRepoFile('packages/common/src/extraction/confidence.ts');
  assert.match(src, /0\.80|>= 0\.80|>= 0\.8\b/, 'strong threshold must be 0.80');
  assert.match(src, /0\.55|>= 0\.55/, 'review_recommended threshold must be 0.55');
});

test('confidence weights sum to approximately 1.0', () => {
  const src = readRepoFile('packages/common/src/extraction/confidence.ts');
  const matches = [...src.matchAll(/WEIGHTS\s*=\s*\{([\s\S]+?)\}/gm)];
  assert.ok(matches.length > 0, 'WEIGHTS constant must be defined');

  const weightsBlock = matches[0][1];
  const values = [...weightsBlock.matchAll(/:\s*([\d.]+)/g)].map(([, v]) => parseFloat(v));
  assert.ok(values.length >= 4, 'must have at least 4 weight entries');

  const sum = values.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1.0) < 0.005, `weights must sum to ~1.0, got ${sum.toFixed(4)}`);
});

// ── Types structure ───────────────────────────────────────────────────────────

test('extraction types file exports required interfaces', () => {
  assert.ok(fileExists('packages/common/src/extraction/types.ts'), 'types file must exist');
  const src = readRepoFile('packages/common/src/extraction/types.ts');
  assert.match(src, /ExtractionResult/, 'must export ExtractionResult');
  assert.match(src, /ExtractionContext/, 'must export ExtractionContext');
  assert.match(src, /ExtractionAdapter/, 'must export ExtractionAdapter');
  assert.match(src, /CaptureRepairJob/, 'must export CaptureRepairJob');
  assert.match(src, /CaptureRepairProvider/, 'must export CaptureRepairProvider');
});

test('ExtractionResult includes all required fields', () => {
  const src = readRepoFile('packages/common/src/extraction/types.ts');
  for (const field of [
    'title', 'company', 'description', 'sourceUrl', 'adapterId',
    'confidenceScore', 'missingFields', 'warnings', 'requiresReview',
    'extractionMethod',
  ]) {
    assert.match(src, new RegExp(`\\b${field}\\b`), `ExtractionResult must include field: ${field}`);
  }
});

// ── Repair stub ───────────────────────────────────────────────────────────────

test('repair stub does not import fetch or any scraping runtime', () => {
  assert.ok(fileExists('packages/common/src/extraction/repair.ts'), 'repair stub must exist');
  const src = readRepoFile('packages/common/src/extraction/repair.ts');
  // Only match actual import statements (not comments that mention forbidden terms)
  const importLines = src.split('\n').filter((l) => /^\s*import\b/.test(l)).join('\n');
  assert.doesNotMatch(importLines, /node-fetch|axios|apify|crawlee|playwright/i, 'repair stub must not import any HTTP/scraping runtime');
});

test('repair stub exports makeNotConfiguredJob', () => {
  const src = readRepoFile('packages/common/src/extraction/repair.ts');
  assert.match(src, /makeNotConfiguredJob/, 'must export makeNotConfiguredJob');
});

test('CaptureRepairStatus includes not_configured', () => {
  const src = readRepoFile('packages/common/src/extraction/types.ts');
  assert.match(src, /not_configured/, 'CaptureRepairStatus must include not_configured');
});

// ── Extension self-contained scorer ──────────────────────────────────────────

test('extension captureConfidence.ts exists and has no @jata/common import', () => {
  assert.ok(
    fileExists('apps/extension/src/lib/captureConfidence.ts'),
    'extension captureConfidence.ts must exist',
  );
  const src = readRepoFile('apps/extension/src/lib/captureConfidence.ts');
  // Only check actual import statements, not comments that mention the package
  const importLines = src.split('\n').filter((l) => /^\s*import\b/.test(l)).join('\n');
  assert.doesNotMatch(importLines, /@jata\/common/, 'extension confidence scorer must not import @jata/common');
  assert.match(src, /computeCaptureConfidence/, 'must export computeCaptureConfidence');
});

test('extension captureInboxClient imports computeCaptureConfidence', () => {
  const src = readRepoFile('apps/extension/src/lib/captureInboxClient.ts');
  assert.match(src, /computeCaptureConfidence/, 'captureInboxClient must use computeCaptureConfidence');
  assert.match(src, /confidenceScore/, 'captureInboxClient must include confidenceScore in parsed.metadata');
  assert.match(src, /requiresReview/, 'captureInboxClient must include requiresReview in parsed.metadata');
});

// ── Packages/common index exports ────────────────────────────────────────────

test('packages/common index re-exports extraction modules', () => {
  const src = readRepoFile('packages/common/index.ts');
  assert.match(src, /extraction\/types/, 'common index must export extraction/types');
  assert.match(src, /extraction\/confidence/, 'common index must export extraction/confidence');
  assert.match(src, /extraction\/adapters/, 'common index must export extraction/adapters');
  assert.match(src, /makeNotConfiguredJob/, 'common index must export makeNotConfiguredJob');
});

// ── UI: ConfidenceBadge ───────────────────────────────────────────────────────

test('ConfidenceBadge is exported from CaptureStatusBadges', () => {
  const src = readRepoFile('apps/web/src/components/capture/CaptureStatusBadges.tsx');
  assert.match(src, /export const ConfidenceBadge/, 'CaptureStatusBadges must export ConfidenceBadge');
  assert.match(src, /strong/, 'ConfidenceBadge must handle strong label');
  assert.match(src, /review_recommended/, 'ConfidenceBadge must handle review_recommended label');
  assert.match(src, /weak/, 'ConfidenceBadge must handle weak label');
});

test('CaptureQueueTable renders Confidence column', () => {
  const src = readRepoFile('apps/web/src/components/capture/CaptureQueueTable.tsx');
  assert.match(src, /ConfidenceBadge/, 'CaptureQueueTable must use ConfidenceBadge');
  assert.match(src, /Confidence/, 'CaptureQueueTable must have Confidence column header');
  assert.match(src, /confidenceLabel/, 'CaptureQueueTable must read confidenceLabel from parsedPayload.metadata');
});
