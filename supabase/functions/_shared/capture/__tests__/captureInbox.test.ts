import {
  ActionLogEventTypes,
  CaptureMethods,
  CaptureSources,
  CaptureStatuses,
} from '../../../../../packages/common/src/captureInbox';
import {
  createCaptureInboxService,
  type CaptureInboxApplicationRecord,
  type CaptureInboxRepository,
} from '../service';

const fixedNow = new Date('2026-05-06T08:00:00.000Z');

function createRecord(
  patch: Partial<CaptureInboxApplicationRecord> = {},
): CaptureInboxApplicationRecord {
  return {
    id: 'application-1',
    user_id: 'user-1',
    title: 'Existing Role',
    company: 'Existing Co',
    status: 'Applied',
    date_applied: '2026-05-06',
    url: null,
    source: null,
    industry: null,
    created_at: fixedNow.toISOString(),
    updated_at: fixedNow.toISOString(),
    job_description: null,
    jata_score: null,
    final_resume_text: null,
    selected_resume_id: null,
    capture_source: null,
    capture_method: null,
    capture_status: null,
    parse_status: null,
    score_status: null,
    duplicate_status: null,
    duplicate_of_application_id: null,
    capture_raw_input: {},
    capture_parsed_payload: {},
    capture_score_result: null,
    capture_dedupe_result: null,
    capture_action_log: [],
    archived_at: null,
    promoted_at: null,
    pack_requested_at: null,
    parsed_at: null,
    scored_at: null,
    ...patch,
  };
}

function createMemoryRepository(initialRecords: CaptureInboxApplicationRecord[] = []) {
  const records = new Map(initialRecords.map((record) => [record.id, record]));

  const repository: CaptureInboxRepository = {
    async insertApplication(record) {
      const saved = createRecord(record);
      records.set(saved.id, saved);
      return saved;
    },
    async getApplication(userId, captureId) {
      const record = records.get(captureId);
      return record?.user_id === userId ? record : null;
    },
    async updateApplication(userId, captureId, patch) {
      const existing = await this.getApplication(userId, captureId);
      if (!existing) throw new Error('Capture not found');
      const updated = { ...existing, ...patch };
      records.set(captureId, updated);
      return updated;
    },
    async listApplications(userId) {
      return {
        items: [...records.values()].filter(
          (record) => record.user_id === userId && record.capture_status,
        ),
        total: records.size,
      };
    },
    async findDuplicateCandidates(userId) {
      return [...records.values()].filter((record) => record.user_id === userId);
    },
  };

  return { records, repository };
}

function createService(repository: CaptureInboxRepository) {
  return createCaptureInboxService({
    repository,
    now: () => fixedNow,
    createId: () => 'capture-1',
  });
}

describe('Capture Inbox contracts', () => {
  it('keeps source, method, status, and action event values shared for future clients', () => {
    expect(CaptureSources).toEqual(
      expect.arrayContaining(['web', 'browser_extension', 'mobile_share', 'telegram']),
    );
    expect(CaptureMethods).toEqual(expect.arrayContaining(['url', 'text', 'manual']));
    expect(CaptureStatuses).toEqual(
      expect.arrayContaining(['inbox', 'shortlisted', 'pack_pending', 'archived']),
    );
    expect(ActionLogEventTypes).toEqual(
      expect.arrayContaining([
        'capture_created',
        'duplicate_detected',
        'parse_completed',
        'score_completed',
        'promoted_to_shortlist',
        'pack_requested',
        'archived',
      ]),
    );
  });
});

describe('Capture Inbox service', () => {
  it('creates captures in the canonical applications store and logs duplicate detection', async () => {
    const { records, repository } = createMemoryRepository([
      createRecord({
        id: 'existing-application',
        title: 'Product Manager',
        company: 'Acme',
        url: 'https://jobs.example/product-manager',
      }),
    ]);
    const service = createService(repository);

    const item = await service.createCapture({
      userId: 'user-1',
      source: 'browser_extension',
      method: 'url',
      url: 'https://jobs.example/product-manager',
      rawText: 'Product Manager role at Acme',
      title: 'Product Manager',
      company: 'Acme',
    });

    expect(records.get('capture-1')).toMatchObject({
      title: 'Product Manager',
      company: 'Acme',
      status: 'Saved',
      capture_source: 'browser_extension',
      capture_method: 'url',
      capture_status: 'inbox',
      parse_status: 'not_started',
      score_status: 'not_started',
      duplicate_status: 'duplicate',
      duplicate_of_application_id: 'existing-application',
    });
    expect(item.dedupeResult?.status).toBe('duplicate');
    expect(item.actionLog.map((event) => event.type)).toEqual([
      'capture_created',
      'duplicate_detected',
    ]);
  });

  it('updates parsed capture fields and records parse completion once', async () => {
    const { records, repository } = createMemoryRepository([
      createRecord({
        id: 'capture-1',
        capture_source: 'web',
        capture_method: 'manual',
        capture_status: 'inbox',
        parse_status: 'not_started',
        score_status: 'not_started',
        duplicate_status: 'unique',
        capture_action_log: [
          { type: 'capture_created', at: fixedNow.toISOString(), actorId: 'user-1' },
        ],
      }),
    ]);
    const service = createService(repository);

    const item = await service.updateCapture({
      userId: 'user-1',
      captureId: 'capture-1',
      parsed: {
        title: 'Operations Lead',
        company: 'Kigali Works',
        jobDescription: 'Lead operations and reporting.',
      },
      parseStatus: 'completed',
    });

    expect(records.get('capture-1')).toMatchObject({
      title: 'Operations Lead',
      company: 'Kigali Works',
      job_description: 'Lead operations and reporting.',
      parse_status: 'completed',
      parsed_at: fixedNow.toISOString(),
    });
    expect(item.actionLog.map((event) => event.type)).toEqual([
      'capture_created',
      'parse_completed',
    ]);
  });

  it('scores, promotes, requests a pack, and archives with action log events', async () => {
    const { records, repository } = createMemoryRepository([
      createRecord({
        id: 'capture-1',
        capture_source: 'web',
        capture_method: 'manual',
        capture_status: 'inbox',
        parse_status: 'completed',
        score_status: 'not_started',
        duplicate_status: 'unique',
        capture_action_log: [
          { type: 'capture_created', at: fixedNow.toISOString(), actorId: 'user-1' },
        ],
      }),
    ]);
    const service = createService(repository);

    await service.scoreCapture({
      userId: 'user-1',
      captureId: 'capture-1',
      score: 82,
      matchedSkills: ['React'],
      missingSkills: ['Stakeholder reporting'],
    });
    await service.promoteToShortlist({ userId: 'user-1', captureId: 'capture-1' });
    await service.requestPackGeneration({ userId: 'user-1', captureId: 'capture-1' });
    const item = await service.archiveCapture({ userId: 'user-1', captureId: 'capture-1' });

    expect(records.get('capture-1')).toMatchObject({
      jata_score: 82,
      score_status: 'completed',
      scored_at: fixedNow.toISOString(),
      capture_status: 'archived',
      promoted_at: fixedNow.toISOString(),
      pack_requested_at: fixedNow.toISOString(),
      archived_at: fixedNow.toISOString(),
    });
    expect(item.actionLog.map((event) => event.type)).toEqual([
      'capture_created',
      'score_completed',
      'promoted_to_shortlist',
      'pack_requested',
      'archived',
    ]);
  });
});
