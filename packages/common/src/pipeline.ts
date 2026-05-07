export const PipelineStatuses = [
  'captured',
  'scored',
  'shortlisted',
  'pack_ready',
  'applied',
  'follow_up_due',
  'interviewing',
  'rejected',
  'closed',
  'archived',
] as const;

export type PipelineStatus = (typeof PipelineStatuses)[number];

export const DatabaseApplicationStatuses = [
  'Saved',
  'Applying',
  'Applied',
  'Interview',
  'Offer',
  'Rejected',
] as const;

export type DatabaseApplicationStatus = (typeof DatabaseApplicationStatuses)[number];
export type AnyApplicationStatus = PipelineStatus | DatabaseApplicationStatus;
export type ScoreBand = 'high' | 'medium' | 'low' | 'unknown';

export interface PipelineApplicationLike {
  id: string;
  title: string;
  company: string;
  status: string | null;
  capture_status?: string | null;
  source?: string | null;
  capture_source?: string | null;
  industry?: string | null;
  jata_score?: number | null;
  follow_up_date?: string | null;
  applied_at?: string | null;
  date_applied?: string | null;
  pack_requested_at?: string | null;
  updated_at?: string | null;
  capture_parsed_payload?: unknown;
}

export interface PipelineQueueItem {
  application_id: string;
  title: string;
  company: string;
  status: PipelineStatus;
  next_action: string;
  follow_up_date: string | null;
  applied_at: string | null;
  date_applied: string | null;
  source: string | null;
  score_band: ScoreBand;
  jata_score: number | null;
  updated_at: string | null;
  is_due_today: boolean;
  is_overdue: boolean;
}

export interface PipelineQueues {
  dueToday: PipelineQueueItem[];
  overdue: PipelineQueueItem[];
  appliedThisWeek: PipelineQueueItem[];
  highScoreWaiting: PipelineQueueItem[];
  packsReady: PipelineQueueItem[];
}

export interface PipelineMetricRow {
  key: string;
  applications: number;
  responses: number;
  response_rate: number;
}

export interface PipelineAnalytics {
  bySource: PipelineMetricRow[];
  byBand: PipelineMetricRow[];
  byIndustry: PipelineMetricRow[];
}

const legacyStatusMap: Record<string, PipelineStatus> = {
  Saved: 'captured',
  saved: 'captured',
  Applying: 'shortlisted',
  applying: 'shortlisted',
  Applied: 'applied',
  applied: 'applied',
  Interview: 'interviewing',
  interview: 'interviewing',
  interviewing: 'interviewing',
  Offer: 'closed',
  offer: 'closed',
  Rejected: 'rejected',
  rejected: 'rejected',
  inbox: 'captured',
  ready: 'pack_ready',
  pack_pending: 'pack_ready',
  shortlisted: 'shortlisted',
  archived: 'archived',
};

const databaseStatusMap: Record<PipelineStatus, DatabaseApplicationStatus> = {
  captured: 'Saved',
  scored: 'Saved',
  shortlisted: 'Applying',
  pack_ready: 'Applying',
  applied: 'Applied',
  follow_up_due: 'Applied',
  interviewing: 'Interview',
  rejected: 'Rejected',
  closed: 'Offer',
  archived: 'Rejected',
};

export const pipelineStatusLabels: Record<PipelineStatus, string> = {
  captured: 'Captured',
  scored: 'Scored',
  shortlisted: 'Shortlisted',
  pack_ready: 'Pack Ready',
  applied: 'Applied',
  follow_up_due: 'Follow-Up Due',
  interviewing: 'Interviewing',
  rejected: 'Rejected',
  closed: 'Closed',
  archived: 'Archived',
};

export const pipelineStatusClasses: Record<PipelineStatus, string> = {
  captured: 'text-jata-status-saved border-jata-status-saved/20 bg-jata-status-saved/10',
  scored: 'text-jata-status-active border-jata-status-active/20 bg-jata-status-active/10',
  shortlisted: 'text-jata-lumen-lime border-jata-lumen-lime/20 bg-jata-lumen-lime/10',
  pack_ready: 'text-jata-status-offer border-jata-status-offer/20 bg-jata-status-offer/10',
  applied: 'text-jata-status-active border-jata-status-active/20 bg-jata-status-active/10',
  follow_up_due: 'text-jata-status-interview border-jata-status-interview/20 bg-jata-status-interview/10',
  interviewing: 'text-jata-status-interview border-jata-status-interview/20 bg-jata-status-interview/10',
  rejected: 'text-jata-status-rejected border-jata-status-rejected/20 bg-jata-status-rejected/10',
  closed: 'text-jata-status-saved border-jata-status-saved/20 bg-jata-status-saved/10',
  archived: 'text-jata-status-saved border-jata-status-saved/20 bg-jata-status-saved/10',
};

function isPresent(value: unknown): boolean {
  return typeof value === 'string' ? value.trim().length > 0 : value !== null && value !== undefined;
}

function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function dateOnly(value?: string | null): string | null {
  if (!isPresent(value)) return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function weekStart(value: string): Date {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  const day = date.getUTCDay();
  date.setUTCDate(date.getUTCDate() - (day === 0 ? 6 : day - 1));
  return date;
}

function sortMetricRows(rows: PipelineMetricRow[]): PipelineMetricRow[] {
  return [...rows].sort((a, b) => b.applications - a.applications || a.key.localeCompare(b.key));
}

function metricRows(
  applications: PipelineApplicationLike[],
  keyFor: (application: PipelineApplicationLike) => string | null | undefined,
): PipelineMetricRow[] {
  const groups = new Map<string, PipelineMetricRow>();

  for (const application of applications) {
    const key = keyFor(application);
    if (!isPresent(key)) continue;
    const existing = groups.get(String(key)) ?? {
      key: String(key),
      applications: 0,
      responses: 0,
      response_rate: 0,
    };
    existing.applications += 1;
    if (isResponseStatus(normalizePipelineStatus(application.status, application.capture_status))) {
      existing.responses += 1;
    }
    groups.set(existing.key, existing);
  }

  return sortMetricRows(
    Array.from(groups.values()).map((row) => ({
      ...row,
      response_rate: row.applications === 0 ? 0 : Number((row.responses / row.applications).toFixed(2)),
    })),
  );
}

export function normalizePipelineStatus(status?: string | null, captureStatus?: string | null): PipelineStatus {
  const rawStatus = isPresent(status) ? String(status).trim() : '';
  const statusKey = rawStatus.toLowerCase();
  const captureKey = isPresent(captureStatus) ? String(captureStatus).trim().toLowerCase() : '';
  const captureMapped = legacyStatusMap[captureKey];

  if (captureMapped && (!rawStatus || statusKey === 'saved' || statusKey === 'applying')) {
    return captureMapped;
  }

  if ((PipelineStatuses as readonly string[]).includes(statusKey)) return statusKey as PipelineStatus;
  if (legacyStatusMap[rawStatus]) return legacyStatusMap[rawStatus];
  if (legacyStatusMap[statusKey]) return legacyStatusMap[statusKey];

  if (captureMapped) return captureMapped;

  return 'captured';
}

export function toDatabaseApplicationStatus(status?: string | null, captureStatus?: string | null): DatabaseApplicationStatus {
  return databaseStatusMap[normalizePipelineStatus(status, captureStatus)];
}

export function getPipelineStatusLabel(status?: string | null, captureStatus?: string | null): string {
  return pipelineStatusLabels[normalizePipelineStatus(status, captureStatus)];
}

export function getPipelineStatusClass(status?: string | null, captureStatus?: string | null): string {
  return pipelineStatusClasses[normalizePipelineStatus(status, captureStatus)];
}

export function calculateScoreBand(score?: number | null): ScoreBand {
  if (typeof score !== 'number' || Number.isNaN(score)) return 'unknown';
  if (score >= 80) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
}

export function getApplicationFollowUpDate(application: Pick<PipelineApplicationLike, 'follow_up_date' | 'capture_parsed_payload'>): string | null {
  const direct = dateOnly(application.follow_up_date);
  if (direct) return direct;

  const parsedPayload = readObject(application.capture_parsed_payload);
  return dateOnly(
    readString(parsedPayload.followUpDate) ||
      readString(parsedPayload.follow_up_date) ||
      readString(parsedPayload.nextFollowUpDate),
  );
}

export function defaultNextAction(status?: string | null, captureStatus?: string | null): string {
  const normalized = normalizePipelineStatus(status, captureStatus);
  const actions: Record<PipelineStatus, string> = {
    captured: 'Score and decide',
    scored: 'Shortlist or archive',
    shortlisted: 'Generate or open pack',
    pack_ready: 'Review pack and apply',
    applied: 'Set follow-up',
    follow_up_due: 'Follow up',
    interviewing: 'Prepare interview',
    rejected: 'Archive or log learning',
    closed: 'No action',
    archived: 'No action',
  };
  return actions[normalized];
}

export function isResponseStatus(status: PipelineStatus): boolean {
  return ['interviewing', 'rejected', 'closed'].includes(status);
}

export function isTerminalPipelineStatus(status?: string | null, captureStatus?: string | null): boolean {
  return ['rejected', 'closed', 'archived'].includes(normalizePipelineStatus(status, captureStatus));
}

export function buildPipelineQueues(
  applications: PipelineApplicationLike[],
  now = new Date().toISOString(),
): PipelineQueues {
  const today = dateOnly(now);
  const startOfWeek = weekStart(now);
  const rows = applications.map((application) => {
    const status = normalizePipelineStatus(application.status, application.capture_status);
    const followUpDate = getApplicationFollowUpDate(application);
    const parsedPayload = readObject(application.capture_parsed_payload);
    const appliedDate =
      readString(parsedPayload.appliedAt) ||
      application.applied_at ||
      application.date_applied ||
      null;

    return {
      application_id: application.id,
      title: application.title,
      company: application.company,
      status,
      next_action: defaultNextAction(status),
      follow_up_date: followUpDate,
      applied_at: application.applied_at ?? readString(parsedPayload.appliedAt),
      date_applied: application.date_applied ?? null,
      source: application.source ?? application.capture_source ?? null,
      score_band: calculateScoreBand(application.jata_score),
      jata_score: application.jata_score ?? null,
      updated_at: application.updated_at ?? null,
      is_due_today: Boolean(followUpDate && today && followUpDate === today),
      is_overdue: Boolean(followUpDate && today && followUpDate < today),
      applied_week_date: appliedDate,
    };
  });

  return {
    dueToday: rows.filter((row) => row.is_due_today),
    overdue: rows.filter((row) => row.is_overdue),
    appliedThisWeek: rows.filter((row) => {
      if (!isPresent(row.applied_week_date)) return false;
      const applied = new Date(row.applied_week_date);
      return !Number.isNaN(applied.getTime()) && applied >= startOfWeek;
    }),
    highScoreWaiting: rows.filter(
      (row) =>
        row.score_band === 'high' &&
        ['scored', 'shortlisted', 'pack_ready', 'applied', 'follow_up_due'].includes(row.status),
    ),
    packsReady: rows.filter((row) => row.status === 'pack_ready'),
  };
}

export function buildPipelineAnalytics(applications: PipelineApplicationLike[]): PipelineAnalytics {
  const bandRank = new Map<ScoreBand, number>([
    ['high', 0],
    ['medium', 1],
    ['low', 2],
    ['unknown', 3],
  ]);

  return {
    bySource: metricRows(applications, (application) => application.source ?? application.capture_source ?? 'unknown'),
    byBand: metricRows(applications, (application) => calculateScoreBand(application.jata_score)).sort(
      (a, b) => (bandRank.get(a.key as ScoreBand) ?? 99) - (bandRank.get(b.key as ScoreBand) ?? 99),
    ),
    byIndustry: metricRows(applications, (application) => application.industry ?? null),
  };
}
