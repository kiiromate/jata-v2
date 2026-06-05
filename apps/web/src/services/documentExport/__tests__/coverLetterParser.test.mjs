/**
 * Tests for coverLetterParser logic.
 * Pure JS equivalent — no build tooling needed.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ── Inline the parser (mirrors coverLetterParser.ts) ──────────────────────────
const SAFETY_BOUNDARY = 'Human Review Required';
const CLAIMS_HEADING = 'Claims to Verify Before Sending';

function parseCoverLetterText(text) {
  const boundaryIdx = text.indexOf(SAFETY_BOUNDARY);
  if (boundaryIdx === -1) return { body: text.trim(), claimsToVerify: [] };

  const body = text.slice(0, boundaryIdx).trim();
  const safetyBlock = text.slice(boundaryIdx);
  const claimsIdx = safetyBlock.indexOf(CLAIMS_HEADING);
  if (claimsIdx === -1) return { body, claimsToVerify: [] };

  const afterHeading = safetyBlock.slice(claimsIdx + CLAIMS_HEADING.length);
  const nextSection = afterHeading.search(/\n\n[A-Z]/);
  const claimsBlock = nextSection === -1 ? afterHeading : afterHeading.slice(0, nextSection);

  const claims = claimsBlock
    .split('\n')
    .map(line => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);

  return { body, claimsToVerify: claims };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('parseCoverLetterText', () => {
  it('returns full text as body when no safety boundary present', () => {
    const text = 'Dear Hiring Manager,\n\nThank you for this opportunity.\n\nSincerely,\nJane';
    const result = parseCoverLetterText(text);
    assert.equal(result.body, text);
    assert.deepEqual(result.claimsToVerify, []);
  });

  it('splits body from embedded safety section', () => {
    const text = [
      'Dear Hiring Manager,\n\nThank you.\n\nSincerely,\nJane',
      '',
      'Human Review Required',
      'Review before sending.',
      '',
      'Claims to Verify Before Sending',
      '- Confirm dates against CV.',
      '- Do not add metrics unless provided.',
      '',
      'Evidence Missing',
      '- Evidence needed: role title.',
    ].join('\n');

    const result = parseCoverLetterText(text);
    assert.ok(result.body.includes('Dear Hiring Manager'));
    assert.ok(!result.body.includes('Human Review Required'));
    assert.deepEqual(result.claimsToVerify, [
      'Confirm dates against CV.',
      'Do not add metrics unless provided.',
    ]);
  });

  it('handles text where Claims section is absent after boundary', () => {
    const text = 'Body text.\n\nHuman Review Required\nReview before sending.';
    const result = parseCoverLetterText(text);
    assert.equal(result.body, 'Body text.');
    assert.deepEqual(result.claimsToVerify, []);
  });

  it('strips bullet prefixes from claims', () => {
    const text = [
      'Body.',
      '',
      'Human Review Required',
      '',
      'Claims to Verify Before Sending',
      '• Claim A',
      '* Claim B',
      '- Claim C',
    ].join('\n');

    const { claimsToVerify } = parseCoverLetterText(text);
    assert.deepEqual(claimsToVerify, ['Claim A', 'Claim B', 'Claim C']);
  });

  it('handles empty string gracefully', () => {
    const result = parseCoverLetterText('');
    assert.equal(result.body, '');
    assert.deepEqual(result.claimsToVerify, []);
  });
});
