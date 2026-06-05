import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createScoreApplicationMatchHandler,
  type ScoreApplicationMatchApplicationRecord,
  type ScoreApplicationMatchRepository,
  type ScoreApplicationMatchResumeRecord,
} from '../service.ts';

const fixedNow = new Date('2026-06-04T12:00:00.000Z');

function createApplication(
  patch: Partial<ScoreApplicationMatchApplicationRecord> = {},
): ScoreApplicationMatchApplicationRecord {
  return {
    id: 'application-1',
    user_id: 'user-1',
    job_description: 'Requires React dashboards and SQL reporting.',
    final_resume_text: null,
    selected_resume_id: 'resume-1',
    capture_raw_input: {},
    capture_parsed_payload: {},
    jata_score: null,
    score_status: null,
    scored_at: null,
    capture_score_result: null,
    ...patch,
  };
}

function createResume(
  patch: Partial<ScoreApplicationMatchResumeRecord> = {},
): ScoreApplicationMatchResumeRecord {
  return {
    id: 'resume-1',
    user_id: 'user-1',
    content: 'Built React dashboards and SQL reports for operating teams.',
    extracted_text: 'Built React dashboards and SQL reports for operating teams.',
    ...patch,
  };
}

function createRequest(body: unknown): Request {
  return new Request('https://functions.example/score-application-match', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function createRepository(options: {
  application?: ScoreApplicationMatchApplicationRecord | null;
  resume?: ScoreApplicationMatchResumeRecord | null;
  schemaError?: Error;
  profileError?: Error;
} = {}) {
  const updates: Array<Record<string, unknown>> = [];
  const repository: ScoreApplicationMatchRepository = {
    async getApplication(userId, applicationId) {
      if (options.schemaError) throw options.schemaError;
      const application = options.application ?? createApplication();
      return application.id === applicationId && application.user_id === userId ? application : null;
    },
    async getResume(userId, resumeId) {
      const resume = options.resume ?? createResume();
      return resume.id === resumeId && resume.user_id === userId ? resume : null;
    },
    async getProfile() {
      if (options.profileError) throw options.profileError;
      return {
        professional_summary: 'Frontend engineer focused on accessible product workflows.',
        skills: ['React', 'SQL', 'Accessibility'],
        experience_level: 'senior',
        industry: 'software',
        location: 'remote',
      };
    },
    async updateApplication(userId, applicationId, patch) {
      updates.push(patch);
      return {
        ...(options.application ?? createApplication()),
        ...patch,
        id: applicationId,
        user_id: userId,
      };
    },
  };

  return { repository, updates };
}

function createHandler(options: Parameters<typeof createRepository>[0] & { userId?: string | null } = {}) {
  const { repository, updates } = createRepository(options);
  const handler = createScoreApplicationMatchHandler({
    getUserId: async () => options.userId === undefined ? 'user-1' : options.userId,
    createRepository: () => repository,
    now: () => fixedNow,
  });

  return { handler, updates };
}

describe('score-application-match handler', () => {
  it('returns 401 when the request is unauthenticated', async () => {
    const { handler } = createHandler({ userId: null });

    const response = await handler(createRequest({ applicationId: 'application-1' }));

    assert.equal(response.status, 401);
  });

  it('returns 404 for a wrong-user application', async () => {
    const { handler } = createHandler({
      application: createApplication({ user_id: 'other-user' }),
    });

    const response = await handler(createRequest({ applicationId: 'application-1' }));

    assert.equal(response.status, 404);
  });

  it('returns 404 for a wrong-user resume', async () => {
    const { handler } = createHandler({
      resume: createResume({ user_id: 'other-user' }),
    });

    const response = await handler(createRequest({ applicationId: 'application-1', resumeId: 'resume-1' }));

    assert.equal(response.status, 404);
  });

  it('returns 400 when job description text is missing', async () => {
    const { handler, updates } = createHandler({
      application: createApplication({ job_description: '', capture_parsed_payload: {}, capture_raw_input: {} }),
    });

    const response = await handler(createRequest({ applicationId: 'application-1' }));

    assert.equal(response.status, 400);
    assert.equal(updates.length, 0);
  });

  it('returns 400 when resume evidence text is missing', async () => {
    const { handler, updates } = createHandler({
      resume: createResume({ extracted_text: '', content: '' }),
      application: createApplication({ final_resume_text: '' }),
    });

    const response = await handler(createRequest({ applicationId: 'application-1' }));

    assert.equal(response.status, 400);
    assert.equal(updates.length, 0);
  });

  it('fails safely before writing when scoring columns are missing', async () => {
    const { handler, updates } = createHandler({
      schemaError: new Error('column applications.capture_score_result does not exist'),
    });

    const response = await handler(createRequest({ applicationId: 'application-1' }));
    const body = await response.json();

    assert.equal(response.status, 500);
    assert.match(body.error, /Schema precheck failed/);
    assert.equal(updates.length, 0);
  });

  it('continues scoring without optional profile enrichment when profile columns are unavailable', async () => {
    const rawResume = 'Built React dashboards and SQL reports for operating teams.';
    const rawJob = 'Requires React dashboards and SQL reporting.';
    const { handler, updates } = createHandler({
      application: createApplication({ job_description: rawJob }),
      resume: createResume({ extracted_text: rawResume, content: 'fallback content' }),
      profileError: new Error('column profiles.professional_summary does not exist'),
    });

    const response = await handler(createRequest({ applicationId: 'application-1', includeProfile: true }));
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(updates.length, 1);
    assert.ok(body.score >= 70);
    assert.equal(body.metadata.usedProfile, false);
    assert.equal(updates[0].score_status, 'completed');
    assert.ok(!JSON.stringify(body).includes(rawResume));
    assert.ok(!JSON.stringify(body).includes(rawJob));
  });

  it('persists successful scoring to existing application fields without returning raw documents', async () => {
    const rawResume = 'Built React dashboards and SQL reports for operating teams.';
    const rawJob = 'Requires React dashboards and SQL reporting.';
    const { handler, updates } = createHandler({
      application: createApplication({ job_description: rawJob }),
      resume: createResume({ extracted_text: rawResume, content: 'fallback content' }),
    });

    const response = await handler(createRequest({ applicationId: 'application-1', includeProfile: true }));
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.ok(body.score >= 70);
    assert.match(body.confidence, /high|medium/);
    assert.ok(body.recommendedAction);
    assert.ok(body.matchedSkills.includes('react'));
    assert.ok(body.matchedSkills.includes('sql'));
    assert.ok(body.evidenceMatches.length > 0);
    assert.ok(Array.isArray(body.claimsToVerify));
    assert.ok(!JSON.stringify(body).includes(rawResume));
    assert.ok(!JSON.stringify(body).includes(rawJob));
    assert.deepEqual(
      {
        jata_score: updates[0].jata_score,
        score_status: updates[0].score_status,
        scored_at: updates[0].scored_at,
        selected_resume_id: updates[0].selected_resume_id,
      },
      {
      jata_score: Math.round(body.score),
      score_status: 'completed',
      scored_at: fixedNow.toISOString(),
      selected_resume_id: 'resume-1',
      },
    );
    assert.deepEqual({
      score: (updates[0].capture_score_result as { score: number }).score,
      confidence: (updates[0].capture_score_result as { confidence: string }).confidence,
      recommendedAction: (updates[0].capture_score_result as { recommendedAction: string }).recommendedAction,
    }, {
      score: body.score,
      confidence: body.confidence,
      recommendedAction: body.recommendedAction,
    });
  });
});
