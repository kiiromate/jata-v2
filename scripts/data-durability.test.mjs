import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildExportBundle,
  calculateScoreBand,
  createCsv,
  findIntegrityIssues,
  sanitizeAiOutput,
  sanitizeResume,
} from './data-durability.mjs';

describe('data durability helpers', () => {
  it('keeps full-fidelity application and capture data while redacting private resume content', () => {
    const application = {
      id: 'app-1',
      user_id: 'user-1',
      title: 'Frontend Engineer',
      company: 'Acme',
      status: 'Applied',
      url: 'https://example.com/job',
      jata_score: 82,
      capture_status: 'inbox',
      capture_action_log: [{ type: 'capture_created', at: '2026-05-06T00:00:00Z' }],
      final_resume_text: 'Generated private resume text',
      pack_requested_at: '2026-05-06T01:00:00Z',
    };
    const resume = {
      id: 'resume-1',
      user_id: 'user-1',
      filename: 'kaze-resume.pdf',
      content: 'Private resume body',
      created_at: '2026-05-06T00:00:00Z',
      updated_at: null,
    };

    const bundle = buildExportBundle({
      userId: 'user-1',
      exportedAt: '2026-05-06T02:00:00Z',
      applications: [application],
      resumes: [resume],
      aiOutputs: [],
    });

    assert.equal(bundle.applications[0].final_resume_text, 'Generated private resume text');
    assert.equal(bundle.captureInbox[0].capture_status, 'inbox');
    assert.equal(bundle.generatedPackMetadata[0].has_final_resume_text, true);
    assert.equal(bundle.generatedPackMetadata[0].final_resume_text_length, 29);
    assert.equal(bundle.resumeMetadata[0].has_content, true);
    assert.equal(bundle.resumeMetadata[0].content_length, 19);
    assert.equal('content' in bundle.resumeMetadata[0], false);
  });

  it('exports AI metadata without output payloads or error text', () => {
    const sanitized = sanitizeAiOutput({
      id: 'ai-1',
      user_id: 'user-1',
      provider: 'openrouter',
      model: 'private-model',
      task_type: 'generateCoverLetter',
      input_hash: 'hash-in',
      output_hash: 'hash-out',
      prompt_char_count: 100,
      response_char_count: 500,
      latency_ms: 1200,
      status: 'success',
      error_message: 'Private provider detail',
      output_payload: { content: 'Private generated letter' },
      created_at: '2026-05-06T00:00:00Z',
    });

    assert.equal(sanitized.has_output_payload, true);
    assert.equal(sanitized.output_payload_type, 'object');
    assert.equal('output_payload' in sanitized, false);
    assert.equal('error_message' in sanitized, false);
  });

  it('creates CSV with escaped values and stable headers', () => {
    const csv = createCsv(
      [
        { id: '1', title: 'Hello, "World"', empty: null },
        { id: '2', title: 'Line\nBreak', empty: '' },
      ],
      ['id', 'title', 'empty'],
    );

    assert.equal(csv, 'id,title,empty\n1,"Hello, ""World""",\n2,"Line\nBreak",\n');
  });

  it('reports integrity issues for missing required fields and duplicate source URLs', () => {
    const issues = findIntegrityIssues({
      applications: [
        { id: 'app-1', user_id: '', title: 'Role', company: 'Acme', status: 'Applied', url: 'https://example.com/a' },
        { id: 'app-2', user_id: 'user-1', title: '', company: 'Acme', status: 'Bad', url: 'https://example.com/a' },
        { id: 'app-3', user_id: 'user-1', title: 'Capture', company: 'Acme', status: 'Applied', capture_source: 'web' },
      ],
      generatedPackMetadata: [{ application_id: null, has_final_resume_text: true }],
    });

    assert.deepEqual(
      issues.map((issue) => issue.code),
      [
        'missing_user_id',
        'missing_title_or_company',
        'invalid_status',
        'capture_without_capture_status',
        'duplicate_source_url',
        'pack_without_application_reference',
      ],
    );
  });

  it('classifies scores into durable bands', () => {
    assert.equal(calculateScoreBand(null), 'unknown');
    assert.equal(calculateScoreBand(40), 'low');
    assert.equal(calculateScoreBand(60), 'medium');
    assert.equal(calculateScoreBand(80), 'high');
  });

  it('redacts resume content while retaining metadata', () => {
    assert.deepEqual(sanitizeResume({ id: 'r1', filename: 'cv.pdf', content: 'abc' }), {
      id: 'r1',
      user_id: undefined,
      filename: 'cv.pdf',
      created_at: undefined,
      updated_at: undefined,
      has_content: true,
      content_length: 3,
    });
  });
});
