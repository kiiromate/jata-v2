import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const APPLICATION_STATUSES = ['Applied', 'Interview', 'Offer', 'Rejected'];

export const CAPTURE_STATUSES = ['inbox', 'processing', 'ready', 'shortlisted', 'pack_pending', 'archived'];

const PAGE_SIZE = 1000;

function isPresent(value) {
  return typeof value === 'string' ? value.trim().length > 0 : value !== null && value !== undefined;
}

function normalizeUrl(value) {
  if (!isPresent(value)) return '';

  try {
    const parsed = new URL(String(value).trim());
    parsed.hash = '';
    return parsed.toString().replace(/\/$/, '').toLowerCase();
  } catch {
    return String(value).trim().replace(/\/$/, '').toLowerCase();
  }
}

function jsonClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readActionLog(value) {
  return Array.isArray(value) ? value : [];
}

function csvValue(value) {
  if (value === null || value === undefined) return '';
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function createCsv(rows, headers) {
  const content = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvValue(row[header])).join(',')),
  ].join('\n');
  return `${content}\n`;
}

export function calculateScoreBand(score) {
  if (typeof score !== 'number' || Number.isNaN(score)) return 'unknown';
  if (score >= 80) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
}

export function sanitizeResume(resume) {
  const content = typeof resume.content === 'string' ? resume.content : '';
  return {
    id: resume.id,
    user_id: resume.user_id,
    filename: resume.filename,
    created_at: resume.created_at,
    updated_at: resume.updated_at,
    has_content: content.length > 0,
    content_length: content.length,
  };
}

export function sanitizeAiOutput(output) {
  const outputPayload = output.output_payload;
  return {
    id: output.id,
    user_id: output.user_id,
    provider: output.provider,
    model: output.model,
    task_type: output.task_type,
    input_hash: output.input_hash,
    output_hash: output.output_hash,
    prompt_char_count: output.prompt_char_count,
    response_char_count: output.response_char_count,
    latency_ms: output.latency_ms,
    status: output.status,
    created_at: output.created_at,
    has_error: isPresent(output.error_message),
    has_output_payload: outputPayload !== null && outputPayload !== undefined,
    output_payload_type: outputPayload === null || outputPayload === undefined ? null : typeof outputPayload,
  };
}

export function buildScoresAndBands(applications) {
  return applications.map((application) => ({
    application_id: application.id,
    title: application.title,
    company: application.company,
    jata_score: application.jata_score ?? null,
    score_band: calculateScoreBand(application.jata_score),
    score_status: application.score_status ?? null,
    capture_score_result: application.capture_score_result ?? null,
    scored_at: application.scored_at ?? null,
  }));
}

export function buildPipelineRows(applications) {
  return applications.map((application) => ({
    application_id: application.id,
    title: application.title,
    company: application.company,
    status: application.status,
    capture_status: application.capture_status ?? null,
    date_applied: application.date_applied ?? null,
    promoted_at: application.promoted_at ?? null,
    pack_requested_at: application.pack_requested_at ?? null,
    archived_at: application.archived_at ?? null,
    updated_at: application.updated_at ?? null,
  }));
}

export function buildCaptureInboxRows(applications) {
  return applications
    .filter((application) => isPresent(application.capture_status))
    .map((application) => ({
      application_id: application.id,
      title: application.title,
      company: application.company,
      url: application.url ?? null,
      capture_source: application.capture_source ?? null,
      capture_method: application.capture_method ?? null,
      capture_status: application.capture_status ?? null,
      parse_status: application.parse_status ?? null,
      score_status: application.score_status ?? null,
      duplicate_status: application.duplicate_status ?? null,
      duplicate_of_application_id: application.duplicate_of_application_id ?? null,
      created_at: application.created_at ?? null,
      updated_at: application.updated_at ?? null,
    }));
}

export function buildActionLogs(applications) {
  return applications.flatMap((application) =>
    readActionLog(application.capture_action_log).map((event, index) => ({
      application_id: application.id,
      action_index: index,
      type: event.type ?? null,
      at: event.at ?? null,
      actor_id: event.actorId ?? event.actor_id ?? null,
      message: event.message ?? null,
      metadata: event.metadata ?? null,
    })),
  );
}

export function buildFollowUpRows(applications) {
  return applications
    .filter((application) =>
      ['Interview', 'Offer'].includes(application.status) ||
      ['ready', 'shortlisted', 'pack_pending'].includes(application.capture_status),
    )
    .map((application) => ({
      application_id: application.id,
      title: application.title,
      company: application.company,
      status: application.status,
      capture_status: application.capture_status ?? null,
      url: application.url ?? null,
      reason: application.status === 'Interview' || application.status === 'Offer'
        ? `Pipeline status: ${application.status}`
        : `Capture status: ${application.capture_status}`,
      updated_at: application.updated_at ?? null,
    }));
}

export function buildGeneratedPackMetadata(applications) {
  return applications
    .filter((application) => isPresent(application.pack_requested_at) || isPresent(application.final_resume_text))
    .map((application) => {
      const finalResumeText = typeof application.final_resume_text === 'string' ? application.final_resume_text : '';
      return {
        application_id: application.id,
        selected_resume_id: application.selected_resume_id ?? null,
        pack_requested_at: application.pack_requested_at ?? null,
        has_final_resume_text: finalResumeText.length > 0,
        final_resume_text_length: finalResumeText.length,
      };
    });
}

export function buildExportBundle({
  userId,
  exportedAt,
  applications,
  resumes,
  aiOutputs,
}) {
  const safeApplications = jsonClone(applications);
  const captureInbox = buildCaptureInboxRows(safeApplications);
  const scoresAndBands = buildScoresAndBands(safeApplications);
  const pipeline = buildPipelineRows(safeApplications);
  const actionLogs = buildActionLogs(safeApplications);
  const followUps = buildFollowUpRows(safeApplications);
  const resumeMetadata = resumes.map(sanitizeResume);
  const aiOutputMetadata = aiOutputs.map(sanitizeAiOutput);
  const generatedPackMetadata = buildGeneratedPackMetadata(safeApplications);

  return {
    schema_version: 1,
    exported_at: exportedAt,
    user_id: userId,
    privacy: {
      resumes: 'metadata_only',
      ai_outputs: 'metadata_only',
      generated_pack_archive: 'not_exported_without_dedicated_safe_storage',
      secrets: 'excluded',
    },
    counts: {
      applications: safeApplications.length,
      capture_inbox: captureInbox.length,
      resumes: resumeMetadata.length,
      ai_outputs: aiOutputMetadata.length,
      generated_pack_metadata: generatedPackMetadata.length,
      action_logs: actionLogs.length,
    },
    applications: safeApplications,
    captureInbox,
    scoresAndBands,
    pipeline,
    actionLogs,
    followUps,
    resumeMetadata,
    aiOutputMetadata,
    generatedPackMetadata,
    generatedPackArchive: {
      available: false,
      reason: 'No dedicated generated-pack storage table or bucket is present in the current schema.',
    },
  };
}

export function findIntegrityIssues({ applications, generatedPackMetadata = [] }) {
  const issues = [];
  const urls = new Map();

  for (const application of applications) {
    if (!isPresent(application.user_id)) {
      issues.push({ code: 'missing_user_id', table: 'applications', id: application.id });
    }

    if (!isPresent(application.title) || !isPresent(application.company)) {
      issues.push({ code: 'missing_title_or_company', table: 'applications', id: application.id });
    }

    if (!APPLICATION_STATUSES.includes(application.status)) {
      issues.push({
        code: 'invalid_status',
        table: 'applications',
        id: application.id,
        value: application.status ?? null,
      });
    }

    const hasCaptureMetadata =
      isPresent(application.capture_source) ||
      isPresent(application.capture_method) ||
      isPresent(application.parse_status) ||
      isPresent(application.score_status) ||
      isPresent(application.duplicate_status);

    if (hasCaptureMetadata && !isPresent(application.capture_status)) {
      issues.push({ code: 'capture_without_capture_status', table: 'applications', id: application.id });
    }

  }

  for (const application of applications) {
    const sourceUrl = normalizeUrl(application.sourceUrl ?? application.source_url ?? application.url);
    if (!sourceUrl) continue;

    const existing = urls.get(sourceUrl);
    if (existing) {
      issues.push({
        code: 'duplicate_source_url',
        table: 'applications',
        id: application.id,
        duplicate_of: existing,
        value: sourceUrl,
      });
    } else {
      urls.set(sourceUrl, application.id);
    }
  }

  for (const pack of generatedPackMetadata) {
    if (!isPresent(pack.application_id)) {
      issues.push({ code: 'pack_without_application_reference', table: 'generatedPackMetadata' });
    }
  }

  return issues;
}

export function getRequiredEnv(env = process.env) {
  const supabaseUrl = env.JATA_EXPORT_SUPABASE_URL || env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const supabaseKey =
    env.JATA_EXPORT_SUPABASE_KEY ||
    env.SUPABASE_SERVICE_ROLE_KEY ||
    env.SUPABASE_ANON_KEY ||
    env.VITE_SUPABASE_ANON_KEY;
  const userId = env.JATA_EXPORT_USER_ID;

  if (!supabaseUrl) throw new Error('Missing SUPABASE_URL or JATA_EXPORT_SUPABASE_URL.');
  if (!supabaseKey) throw new Error('Missing Supabase key. Use a private local env value, never .env.example.');
  if (!userId) throw new Error('Missing JATA_EXPORT_USER_ID. Refusing to export all users by default.');

  return { supabaseUrl: supabaseUrl.replace(/\/$/, ''), supabaseKey, userId };
}

export async function fetchTableRows({ supabaseUrl, supabaseKey, table, userId, select = '*' }) {
  const rows = [];
  let offset = 0;

  while (true) {
    const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
    url.searchParams.set('select', select);
    url.searchParams.set('user_id', `eq.${userId}`);
    url.searchParams.set('order', 'created_at.asc');

    const response = await fetch(url, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Range: `${offset}-${offset + PAGE_SIZE - 1}`,
      },
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Failed to export ${table}: ${response.status} ${message}`);
    }

    const page = await response.json();
    rows.push(...page);

    if (page.length < PAGE_SIZE) return rows;
    offset += PAGE_SIZE;
  }
}

export async function fetchOptionalTableRows(options) {
  try {
    return { rows: await fetchTableRows(options), warning: null };
  } catch (error) {
    return {
      rows: [],
      warning: error instanceof Error ? error.message : `Failed to export ${options.table}.`,
    };
  }
}

export function defaultExportDir(exportedAt = new Date().toISOString()) {
  const safeTimestamp = exportedAt.replaceAll(':', '-').replace(/\.\d{3}Z$/, 'Z');
  return path.join('exports', `jata-export-${safeTimestamp}`);
}

export async function writeExportFiles(exportDir, bundle) {
  await mkdir(exportDir, { recursive: true });

  const files = {
    'backup.json': JSON.stringify(bundle, null, 2),
    'applications.csv': createCsv(bundle.applications, [
      'id',
      'user_id',
      'title',
      'company',
      'status',
      'date_applied',
      'url',
      'source',
      'industry',
      'jata_score',
      'capture_status',
      'created_at',
      'updated_at',
    ]),
    'capture-inbox.csv': createCsv(bundle.captureInbox, [
      'application_id',
      'title',
      'company',
      'url',
      'capture_source',
      'capture_method',
      'capture_status',
      'parse_status',
      'score_status',
      'duplicate_status',
      'created_at',
      'updated_at',
    ]),
    'pipeline.csv': createCsv(bundle.pipeline, [
      'application_id',
      'title',
      'company',
      'status',
      'capture_status',
      'date_applied',
      'promoted_at',
      'pack_requested_at',
      'archived_at',
      'updated_at',
    ]),
    'follow-ups.csv': createCsv(bundle.followUps, [
      'application_id',
      'title',
      'company',
      'status',
      'capture_status',
      'url',
      'reason',
      'updated_at',
    ]),
    'scores.csv': createCsv(bundle.scoresAndBands, [
      'application_id',
      'title',
      'company',
      'jata_score',
      'score_band',
      'score_status',
      'scored_at',
    ]),
    'integrity-report.json': JSON.stringify(
      {
        exported_at: bundle.exported_at,
        user_id: bundle.user_id,
        issues: findIntegrityIssues({
          applications: bundle.applications,
          generatedPackMetadata: bundle.generatedPackMetadata,
        }),
      },
      null,
      2,
    ),
  };

  await Promise.all(
    Object.entries(files).map(([name, content]) =>
      writeFile(path.join(exportDir, name), content.endsWith('\n') ? content : `${content}\n`, 'utf8'),
    ),
  );

  return Object.keys(files).map((name) => path.join(exportDir, name));
}
