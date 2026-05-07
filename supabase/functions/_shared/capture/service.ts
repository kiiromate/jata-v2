import type {
  ActionLogEvent,
  CaptureIdInput,
  CaptureInboxItem,
  CaptureListQuery,
  CaptureMethod,
  CaptureParsedPayload,
  CaptureRawInput,
  CaptureScoreInput,
  CaptureScoreResult,
  CaptureSource,
  CaptureStatus,
  CreateCaptureInput,
  DedupeResult,
  DuplicateStatus,
  Json,
  ParseStatus,
  ScoreStatus,
  UpdateCaptureInput,
} from '../../../../packages/common/src/captureInbox.ts';

type ApplicationStatus = 'Saved' | 'Applying' | 'Applied' | 'Interview' | 'Offer' | 'Rejected';

export interface CaptureInboxApplicationRecord {
  id: string;
  user_id: string;
  title: string;
  company: string;
  status: ApplicationStatus;
  date_applied: string;
  url: string | null;
  source: string | null;
  industry: string | null;
  job_description: string | null;
  jata_score: number | null;
  final_resume_text: string | null;
  selected_resume_id: string | null;
  capture_source: CaptureSource | null;
  capture_method: CaptureMethod | null;
  capture_status: CaptureStatus | null;
  parse_status: ParseStatus | null;
  score_status: ScoreStatus | null;
  duplicate_status: DuplicateStatus | null;
  duplicate_of_application_id: string | null;
  capture_raw_input: Json;
  capture_parsed_payload: Json;
  capture_score_result: Json | null;
  capture_dedupe_result: Json | null;
  capture_action_log: Json;
  archived_at: string | null;
  promoted_at: string | null;
  pack_requested_at: string | null;
  parsed_at: string | null;
  scored_at: string | null;
  created_at: string;
  updated_at: string;
}

type ApplicationInsert = Partial<CaptureInboxApplicationRecord> &
  Pick<
    CaptureInboxApplicationRecord,
    'id' | 'user_id' | 'title' | 'company' | 'status' | 'date_applied'
  >;

export interface CaptureInboxRepository {
  insertApplication(record: ApplicationInsert): Promise<CaptureInboxApplicationRecord>;
  getApplication(userId: string, captureId: string): Promise<CaptureInboxApplicationRecord | null>;
  updateApplication(
    userId: string,
    captureId: string,
    patch: Partial<CaptureInboxApplicationRecord>,
  ): Promise<CaptureInboxApplicationRecord>;
  listApplications(
    userId: string,
    query?: CaptureListQuery,
  ): Promise<{ items: CaptureInboxApplicationRecord[]; total: number }>;
  findDuplicateCandidates(
    userId: string,
    input: { url?: string | null; title?: string | null; company?: string | null; excludeId?: string },
  ): Promise<CaptureInboxApplicationRecord[]>;
}

interface CaptureInboxServiceOptions {
  repository: CaptureInboxRepository;
  now?: () => Date;
  createId?: () => string;
}

function asJson(value: unknown): Json {
  return value as Json;
}

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function dateOnly(value: Date): string {
  return value.toISOString().split('T')[0];
}

function normalizeUrl(value: string | null | undefined): string | null {
  const trimmed = clean(value);
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    parsed.hash = '';
    return parsed.toString().replace(/\/$/, '').toLowerCase();
  } catch {
    return trimmed.replace(/\/$/, '').toLowerCase();
  }
}

function normalizeText(value: string | null | undefined): string {
  return clean(value)?.toLowerCase() || '';
}

function readArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function readObject<T extends object>(value: unknown, fallback: T): T {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as T;
  }

  return fallback;
}

function readActionLog(value: Json): ActionLogEvent[] {
  return readArray<ActionLogEvent>(value);
}

function createActionEvent(
  type: ActionLogEvent['type'],
  actorId: string,
  at: string,
  metadata?: ActionLogEvent['metadata'],
): ActionLogEvent {
  return metadata ? { type, at, actorId, metadata } : { type, at, actorId };
}

function appendActionEvent(
  existing: ActionLogEvent[],
  event: ActionLogEvent,
  once = false,
): ActionLogEvent[] {
  if (once && existing.some((item) => item.type === event.type)) {
    return existing;
  }

  return [...existing, event];
}

function buildRawInput(input: CreateCaptureInput | UpdateCaptureInput): CaptureRawInput {
  return {
    url: 'url' in input ? clean(input.url) : null,
    text: 'rawText' in input ? clean(input.rawText) : null,
    title: 'title' in input ? clean(input.title) : null,
    company: 'company' in input ? clean(input.company) : null,
    metadata: input.metadata,
  };
}

function mergeRawInput(
  existing: Json,
  input: UpdateCaptureInput,
): CaptureRawInput {
  const current = readObject<CaptureRawInput>(existing, {});
  return {
    ...current,
    ...(input.url !== undefined ? { url: clean(input.url) } : {}),
    ...(input.rawText !== undefined ? { text: clean(input.rawText) } : {}),
    ...(input.title !== undefined ? { title: clean(input.title) } : {}),
    ...(input.company !== undefined ? { company: clean(input.company) } : {}),
    ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
  };
}

function mergeParsedPayload(
  existing: Json,
  parsed: CaptureParsedPayload | undefined,
): CaptureParsedPayload {
  const current = readObject<CaptureParsedPayload>(existing, {});
  return parsed ? { ...current, ...parsed } : current;
}

function dedupeCapture(
  candidates: CaptureInboxApplicationRecord[],
  input: { url?: string | null; title?: string | null; company?: string | null; excludeId?: string },
  checkedAt: string,
): DedupeResult {
  const requestedUrl = normalizeUrl(input.url);
  const requestedTitle = normalizeText(input.title);
  const requestedCompany = normalizeText(input.company);
  const usableCandidates = candidates.filter((candidate) => candidate.id !== input.excludeId);

  if (requestedUrl) {
    const exactUrlMatch = usableCandidates.find(
      (candidate) => normalizeUrl(candidate.url) === requestedUrl,
    );

    if (exactUrlMatch) {
      return {
        status: 'duplicate',
        matchedApplicationId: exactUrlMatch.id,
        confidence: 1,
        reasons: ['Exact URL match with an existing application.'],
        checkedAt,
      };
    }
  }

  if (requestedTitle && requestedCompany) {
    const titleCompanyMatch = usableCandidates.find(
      (candidate) =>
        normalizeText(candidate.title) === requestedTitle &&
        normalizeText(candidate.company) === requestedCompany,
    );

    if (titleCompanyMatch) {
      return {
        status: 'possible_duplicate',
        matchedApplicationId: titleCompanyMatch.id,
        confidence: 0.8,
        reasons: ['Same title and company as an existing application.'],
        checkedAt,
      };
    }
  }

  return {
    status: 'unique',
    matchedApplicationId: null,
    confidence: 0,
    reasons: [],
    checkedAt,
  };
}

function toCaptureInboxItem(record: CaptureInboxApplicationRecord): CaptureInboxItem {
  return {
    id: record.id,
    applicationId: record.id,
    userId: record.user_id,
    title: record.title,
    company: record.company,
    url: record.url,
    industry: record.industry,
    source: record.capture_source || 'manual',
    method: record.capture_method || 'manual',
    status: record.capture_status || 'inbox',
    parseStatus: record.parse_status || 'not_started',
    scoreStatus: record.score_status || 'not_started',
    duplicateStatus: record.duplicate_status || 'unknown',
    rawInput: readObject<CaptureRawInput>(record.capture_raw_input, {}),
    parsedPayload: readObject<CaptureParsedPayload>(record.capture_parsed_payload, {}),
    scoreResult: record.capture_score_result
      ? readObject<CaptureScoreResult>(record.capture_score_result, {
          score: record.jata_score || 0,
          matchedSkills: [],
          missingSkills: [],
        })
      : null,
    dedupeResult: record.capture_dedupe_result
      ? readObject<DedupeResult>(record.capture_dedupe_result, {
          status: record.duplicate_status || 'unknown',
          confidence: 0,
          reasons: [],
          checkedAt: record.created_at,
        })
      : null,
    duplicateOfApplicationId: record.duplicate_of_application_id,
    actionLog: readActionLog(record.capture_action_log),
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    parsedAt: record.parsed_at,
    scoredAt: record.scored_at,
    promotedAt: record.promoted_at,
    packRequestedAt: record.pack_requested_at,
    archivedAt: record.archived_at,
  };
}

async function requireCapture(
  repository: CaptureInboxRepository,
  userId: string,
  captureId: string,
): Promise<CaptureInboxApplicationRecord> {
  const record = await repository.getApplication(userId, captureId);
  if (!record || !record.capture_status) {
    throw new Error('Capture not found');
  }

  return record;
}

export function createCaptureInboxService(options: CaptureInboxServiceOptions) {
  const now = () => options.now?.() || new Date();
  const createId = () => options.createId?.() || crypto.randomUUID();
  const repository = options.repository;

  return {
    async createCapture(input: CreateCaptureInput): Promise<CaptureInboxItem> {
      const at = now().toISOString();
      const rawInput = buildRawInput(input);
      const parsed = input.parsed || {};
      const title = clean(input.title) || clean(parsed.title) || 'Untitled opportunity';
      const company = clean(input.company) || clean(parsed.company) || 'Unknown company';
      const url = clean(input.url) || clean(parsed.url);
      const parseStatus: ParseStatus = input.parseStatus || (input.parsed ? 'completed' : 'not_started');
      const candidates = await repository.findDuplicateCandidates(input.userId, {
        url,
        title,
        company,
      });
      const dedupeResult = dedupeCapture(candidates, { url, title, company }, at);
      let actionLog = [
        createActionEvent('capture_created', input.userId, at, {
          source: input.source,
          method: input.method,
        }),
      ];

      if (dedupeResult.status === 'duplicate' || dedupeResult.status === 'possible_duplicate') {
        actionLog = appendActionEvent(
          actionLog,
          createActionEvent('duplicate_detected', input.userId, at, {
            duplicateStatus: dedupeResult.status,
            matchedApplicationId: dedupeResult.matchedApplicationId || null,
          }),
        );
      }

      if (parseStatus === 'completed') {
        actionLog = appendActionEvent(actionLog, createActionEvent('parse_completed', input.userId, at));
      }

      const saved = await repository.insertApplication({
        id: createId(),
        user_id: input.userId,
        title,
        company,
        status: 'Saved',
        date_applied: dateOnly(now()),
        url,
        source: input.source,
        industry: clean(input.industry) || clean(parsed.industry),
        job_description: clean(parsed.jobDescription) || clean(input.rawText),
        jata_score: null,
        final_resume_text: null,
        selected_resume_id: null,
        capture_source: input.source,
        capture_method: input.method,
        capture_status: 'inbox',
        parse_status: parseStatus,
        score_status: 'not_started',
        duplicate_status: dedupeResult.status,
        duplicate_of_application_id: dedupeResult.matchedApplicationId || null,
        capture_raw_input: asJson(rawInput),
        capture_parsed_payload: asJson(parsed),
        capture_score_result: null,
        capture_dedupe_result: asJson(dedupeResult),
        capture_action_log: asJson(actionLog),
        archived_at: null,
        promoted_at: null,
        pack_requested_at: null,
        parsed_at: parseStatus === 'completed' ? at : null,
        scored_at: null,
        created_at: at,
        updated_at: at,
      });

      return toCaptureInboxItem(saved);
    },

    async listCaptures(
      input: { userId: string } & CaptureListQuery,
    ): Promise<{ items: CaptureInboxItem[]; total: number }> {
      const { userId, ...query } = input;
      const result = await repository.listApplications(userId, query);
      return {
        items: result.items.map(toCaptureInboxItem),
        total: result.total,
      };
    },

    async updateCapture(input: UpdateCaptureInput): Promise<CaptureInboxItem> {
      const existing = await requireCapture(repository, input.userId, input.captureId);
      const at = now().toISOString();
      const rawInput = mergeRawInput(existing.capture_raw_input, input);
      const parsedPayload = mergeParsedPayload(existing.capture_parsed_payload, input.parsed);
      const parseStatus = input.parseStatus || existing.parse_status || 'not_started';
      let actionLog = readActionLog(existing.capture_action_log);
      const patch: Partial<CaptureInboxApplicationRecord> = {
        updated_at: at,
        capture_raw_input: asJson(rawInput),
        capture_parsed_payload: asJson(parsedPayload),
      };

      if (input.source) patch.capture_source = input.source;
      if (input.method) patch.capture_method = input.method;
      if (input.status) patch.capture_status = input.status;
      if (input.scoreStatus) patch.score_status = input.scoreStatus;
      if (input.duplicateStatus) patch.duplicate_status = input.duplicateStatus;
      if (input.title !== undefined || input.parsed?.title !== undefined) {
        patch.title = clean(input.title) || clean(input.parsed?.title) || existing.title;
      }
      if (input.company !== undefined || input.parsed?.company !== undefined) {
        patch.company = clean(input.company) || clean(input.parsed?.company) || existing.company;
      }
      if (input.url !== undefined || input.parsed?.url !== undefined) {
        patch.url = clean(input.url) || clean(input.parsed?.url);
      }
      if (input.industry !== undefined || input.parsed?.industry !== undefined) {
        patch.industry = clean(input.industry) || clean(input.parsed?.industry);
      }
      if (input.parsed?.jobDescription !== undefined) {
        patch.job_description = clean(input.parsed.jobDescription);
      }
      if (input.rawText !== undefined && !patch.job_description) {
        patch.job_description = clean(input.rawText);
      }
      if (parseStatus !== existing.parse_status) {
        patch.parse_status = parseStatus;
      }
      if (parseStatus === 'completed' && existing.parse_status !== 'completed') {
        patch.parsed_at = at;
        actionLog = appendActionEvent(
          actionLog,
          createActionEvent('parse_completed', input.userId, at),
          true,
        );
      }

      patch.capture_action_log = asJson(actionLog);

      return toCaptureInboxItem(
        await repository.updateApplication(input.userId, input.captureId, patch),
      );
    },

    async archiveCapture(input: CaptureIdInput): Promise<CaptureInboxItem> {
      const existing = await requireCapture(repository, input.userId, input.captureId);
      const at = now().toISOString();
      const actionLog = appendActionEvent(
        readActionLog(existing.capture_action_log),
        createActionEvent('archived', input.userId, at),
      );

      return toCaptureInboxItem(
        await repository.updateApplication(input.userId, input.captureId, {
          capture_status: 'archived',
          archived_at: at,
          updated_at: at,
          capture_action_log: asJson(actionLog),
        }),
      );
    },

    async scoreCapture(input: CaptureScoreInput): Promise<CaptureInboxItem> {
      const existing = await requireCapture(repository, input.userId, input.captureId);
      const at = now().toISOString();
      const scoreResult: CaptureScoreResult = {
        score: input.score,
        matchedSkills: input.matchedSkills || [],
        missingSkills: input.missingSkills || [],
        suggestions: input.suggestions,
        atsScore: input.atsScore,
        atsIssues: input.atsIssues,
        metadata: input.metadata,
      };
      const actionLog = appendActionEvent(
        readActionLog(existing.capture_action_log),
        createActionEvent('score_completed', input.userId, at, { score: input.score }),
      );

      return toCaptureInboxItem(
        await repository.updateApplication(input.userId, input.captureId, {
          jata_score: Math.round(input.score),
          score_status: 'completed',
          scored_at: at,
          updated_at: at,
          capture_score_result: asJson(scoreResult),
          capture_action_log: asJson(actionLog),
        }),
      );
    },

    async promoteToShortlist(input: CaptureIdInput): Promise<CaptureInboxItem> {
      const existing = await requireCapture(repository, input.userId, input.captureId);
      const at = now().toISOString();
      const actionLog = appendActionEvent(
        readActionLog(existing.capture_action_log),
        createActionEvent('promoted_to_shortlist', input.userId, at),
      );

      return toCaptureInboxItem(
        await repository.updateApplication(input.userId, input.captureId, {
          capture_status: 'shortlisted',
          promoted_at: at,
          updated_at: at,
          capture_action_log: asJson(actionLog),
        }),
      );
    },

    async requestPackGeneration(input: CaptureIdInput): Promise<CaptureInboxItem> {
      const existing = await requireCapture(repository, input.userId, input.captureId);
      const at = now().toISOString();
      const actionLog = appendActionEvent(
        readActionLog(existing.capture_action_log),
        createActionEvent('pack_requested', input.userId, at),
      );

      return toCaptureInboxItem(
        await repository.updateApplication(input.userId, input.captureId, {
          capture_status: 'pack_pending',
          pack_requested_at: at,
          updated_at: at,
          capture_action_log: asJson(actionLog),
        }),
      );
    },

    async generatePackLater(input: CaptureIdInput): Promise<CaptureInboxItem> {
      return this.requestPackGeneration(input);
    },
  };
}

function assertNoDatabaseError(error: { message?: string } | null | undefined, operation: string): void {
  if (error) {
    throw new Error(`${operation}: ${error.message || 'Database error'}`);
  }
}

export function createSupabaseCaptureInboxRepository(supabase: { from: (table: string) => any }): CaptureInboxRepository {
  return {
    async insertApplication(record) {
      const { data, error } = await supabase
        .from('applications')
        .insert(record)
        .select('*')
        .single();

      assertNoDatabaseError(error, 'Failed to create capture');
      return data as CaptureInboxApplicationRecord;
    },

    async getApplication(userId, captureId) {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', userId)
        .eq('id', captureId)
        .maybeSingle();

      assertNoDatabaseError(error, 'Failed to read capture');
      return data as CaptureInboxApplicationRecord | null;
    },

    async updateApplication(userId, captureId, patch) {
      const { data, error } = await supabase
        .from('applications')
        .update(patch)
        .eq('user_id', userId)
        .eq('id', captureId)
        .select('*')
        .single();

      assertNoDatabaseError(error, 'Failed to update capture');
      return data as CaptureInboxApplicationRecord;
    },

    async listApplications(userId, query = {}) {
      const limit = query.limit ?? 50;
      const offset = query.offset ?? 0;
      let builder = supabase
        .from('applications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .not('capture_status', 'is', null)
        .order('created_at', { ascending: false });

      if (query.status) {
        builder = builder.eq('capture_status', query.status);
      } else if (!query.includeArchived) {
        builder = builder.not('capture_status', 'eq', 'archived');
      }

      if (query.source) {
        builder = builder.eq('capture_source', query.source);
      }

      const { data, error, count } = await builder.range(offset, offset + limit - 1);
      assertNoDatabaseError(error, 'Failed to list captures');

      return {
        items: (data || []) as CaptureInboxApplicationRecord[],
        total: count || 0,
      };
    },

    async findDuplicateCandidates(userId, input) {
      let builder = supabase
        .from('applications')
        .select('*')
        .eq('user_id', userId)
        .limit(50);

      if (input.url) {
        builder = builder.eq('url', input.url);
      }

      const { data, error } = await builder;
      assertNoDatabaseError(error, 'Failed to check duplicate captures');
      return (data || []) as CaptureInboxApplicationRecord[];
    },
  };
}
