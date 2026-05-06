import {
  buildPrompt,
  createAiRouter,
  executeAiTask,
  type AiCreditsStore,
  type AiProvider,
  type AiUsageStore,
} from '../index';
import { hashTaskInput } from '../hash';
import type {
  AiOutputPayload,
  AiProviderMode,
  AiTaskInput,
  AiTaskType,
  AiTextOutput,
} from '../types';

const baseInput: AiTaskInput<'generateCoverLetter'> = {
  cvText: 'Experience: React, TypeScript, customer support systems.',
  jobDescription: 'Role needs React and TypeScript for a support platform.',
  userProfile: 'Product engineer',
  notes: 'Keep it concise.',
  jobTitle: 'Frontend Engineer',
  companyName: 'Acme',
  userName: 'Kaze',
  highlights: ['Built React dashboards'],
  tone: 'professional',
};

/** Creates a minimal successful text output for provider tests. */
function createTextOutput(content = 'Draft content'): AiTextOutput {
  return {
    content,
    safety: {
      humanReviewRequired: 'Human Review Required',
      claimsToVerifyBeforeSending: ['Review company name before sending.'],
      evidenceMissing: ['Evidence needed: measurable result for this role.'],
      suggestedEdits: ['Add a concrete metric if it exists in your CV.'],
    },
  };
}

/** Creates a provider double with call counting. */
function createProvider(mode: AiProviderMode, shouldFail = false): AiProvider {
  const provider: AiProvider = {
    mode,
    model: `${mode}-model`,
    async analyzeCvMatch() {
      if (shouldFail) throw new Error('provider failed');
      return {
        score: 50,
        matchedSkills: ['React'],
        missingSkills: ['Testing'],
        suggestions: ['Add evidence for Testing if accurate.'],
        safety: createTextOutput().safety,
      };
    },
    async suggestResumeImprovements() {
      if (shouldFail) throw new Error('provider failed');
      return createTextOutput('Improve the resume with verified facts only.');
    },
    async generateCoverLetter() {
      if (shouldFail) throw new Error('provider failed');
      return createTextOutput('Cover letter draft.');
    },
    async generateRecruiterMessage() {
      if (shouldFail) throw new Error('provider failed');
      return createTextOutput('Recruiter message draft.');
    },
    async generateFollowUpMessage() {
      if (shouldFail) throw new Error('provider failed');
      return createTextOutput('Follow up message draft.');
    },
    async summarizeOpportunity() {
      if (shouldFail) throw new Error('provider failed');
      return createTextOutput('Opportunity summary.');
    },
  };

  return provider;
}

/** Creates an in-memory usage store for executor tests. */
function createUsageStore(options: {
  cachedOutput?: AiOutputPayload | null;
  dailyCount?: number;
  monthlyCount?: number;
} = {}): AiUsageStore & {
  logged: Array<{ status: string }>;
  countWindows: string[];
} {
  return {
    logged: [],
    countWindows: [],
    async findCachedOutput() {
      return options.cachedOutput || null;
    },
    async countUserOutputs(_userId, sinceIso) {
      this.countWindows.push(sinceIso);
      return this.countWindows.length === 1 ? options.dailyCount || 0 : options.monthlyCount || 0;
    },
    async countRecentFailures() {
      return 0;
    },
    async logOutput(record) {
      this.logged.push({ status: record.status });
    },
  };
}

/** Creates an in-memory credits store for executor tests. */
function createCreditsStore(): AiCreditsStore & { deductions: number } {
  return {
    deductions: 0,
    async checkEntitlement() {
      return { allowed: true, enabled: true };
    },
    async deductAfterSuccess() {
      this.deductions += 1;
    },
  };
}

describe('ai provider routing', () => {
  it('uses a user provider setting before the environment default', () => {
    const router = createAiRouter({
      env: {
        JATA_AI_PROVIDER: 'mock',
        JATA_AI_MODEL_DEFAULT: 'openrouter-cheap',
        OPENROUTER_API_KEY: 'present',
      },
      providers: {
        mock: createProvider('mock'),
        huggingface: createProvider('huggingface'),
        openrouter: createProvider('openrouter'),
      },
    });

    const provider = router.resolveProvider('openrouter');

    expect(provider.mode).toBe('openrouter');
  });

  it('falls back to mock when the configured provider has no API key', () => {
    const router = createAiRouter({
      env: {
        JATA_AI_PROVIDER: 'openrouter',
        JATA_AI_MODEL_DEFAULT: 'openrouter-cheap',
      },
      providers: {
        mock: createProvider('mock'),
        huggingface: createProvider('huggingface'),
        openrouter: createProvider('openrouter'),
      },
    });

    const provider = router.resolveProvider();

    expect(provider.mode).toBe('mock');
  });

  it('routes to explicit no-AI mode without requiring provider credentials', () => {
    const router = createAiRouter({
      env: {
        JATA_AI_PROVIDER: 'none',
      },
    });

    const provider = router.resolveProvider();

    expect(provider.mode).toBe('none');
    expect(provider.model).toBe('ai-disabled');
  });
});

describe('ai execution controls', () => {
  it('blocks oversized job descriptions before the provider is called', async () => {
    const provider = createProvider('mock');
    const spy = jest.spyOn(provider, 'generateCoverLetter');

    await expect(
      executeAiTask({
        userId: 'user-1',
        taskType: 'generateCoverLetter',
        input: { ...baseInput, jobDescription: 'x'.repeat(21) },
        provider,
        usageStore: createUsageStore(),
        creditsStore: createCreditsStore(),
        env: { JATA_AI_MAX_JD_CHARS: '20' },
        now: () => new Date('2026-01-01T00:00:00.000Z'),
      }),
    ).rejects.toThrow('Job description is too long');

    expect(spy).not.toHaveBeenCalled();
  });

  it('blocks oversized CV text before the provider is called', async () => {
    const provider = createProvider('mock');
    const spy = jest.spyOn(provider, 'generateCoverLetter');

    await expect(
      executeAiTask({
        userId: 'user-1',
        taskType: 'generateCoverLetter',
        input: { ...baseInput, cvText: 'x'.repeat(21) },
        provider,
        usageStore: createUsageStore(),
        creditsStore: createCreditsStore(),
        env: { JATA_AI_MAX_CV_CHARS: '20' },
        now: () => new Date('2026-01-01T00:00:00.000Z'),
      }),
    ).rejects.toThrow('CV is too long');

    expect(spy).not.toHaveBeenCalled();
  });

  it('blocks oversized profile text before the provider is called', async () => {
    const provider = createProvider('mock');
    const spy = jest.spyOn(provider, 'generateCoverLetter');

    await expect(
      executeAiTask({
        userId: 'user-1',
        taskType: 'generateCoverLetter',
        input: { ...baseInput, userProfile: 'x'.repeat(21) },
        provider,
        usageStore: createUsageStore(),
        creditsStore: createCreditsStore(),
        env: { JATA_AI_MAX_PROFILE_CHARS: '20' },
        now: () => new Date('2026-01-01T00:00:00.000Z'),
      }),
    ).rejects.toThrow('Profile is too long');

    expect(spy).not.toHaveBeenCalled();
  });

  it('enforces the daily request limit before the provider is called', async () => {
    const provider = createProvider('mock');
    const spy = jest.spyOn(provider, 'generateCoverLetter');

    await expect(
      executeAiTask({
        userId: 'user-1',
        taskType: 'generateCoverLetter',
        input: baseInput,
        provider,
        usageStore: createUsageStore({ dailyCount: 2 }),
        creditsStore: createCreditsStore(),
        env: { JATA_AI_DAILY_LIMIT: '2' },
        now: () => new Date('2026-01-01T00:00:00.000Z'),
      }),
    ).rejects.toThrow('Daily AI request limit reached');

    expect(spy).not.toHaveBeenCalled();
  });

  it('enforces the monthly request limit before the provider is called', async () => {
    const provider = createProvider('mock');
    const spy = jest.spyOn(provider, 'generateCoverLetter');

    await expect(
      executeAiTask({
        userId: 'user-1',
        taskType: 'generateCoverLetter',
        input: baseInput,
        provider,
        usageStore: createUsageStore({ dailyCount: 1, monthlyCount: 3 }),
        creditsStore: createCreditsStore(),
        env: { JATA_AI_DAILY_LIMIT: '10', JATA_AI_MONTHLY_LIMIT: '3' },
        now: () => new Date('2026-01-01T00:00:00.000Z'),
      }),
    ).rejects.toThrow('Monthly AI request limit reached');

    expect(spy).not.toHaveBeenCalled();
  });

  it('returns a duplicate cached output before the provider is called', async () => {
    const cached = {
      taskType: 'generateCoverLetter' as AiTaskType,
      output: createTextOutput('Cached draft.'),
      metadata: {
        provider: 'mock' as AiProviderMode,
        model: 'mock-model',
        generatedAt: '2026-01-01T00:00:00.000Z',
        cached: false,
      },
    };
    const provider = createProvider('openrouter');
    const spy = jest.spyOn(provider, 'generateCoverLetter');

    const result = await executeAiTask({
      userId: 'user-1',
      taskType: 'generateCoverLetter',
      input: baseInput,
      provider,
      usageStore: createUsageStore({ cachedOutput: cached }),
      creditsStore: createCreditsStore(),
      env: {},
      now: () => new Date('2026-01-02T00:00:00.000Z'),
    });

    expect(result.output.content).toBe('Cached draft.');
    expect(result.metadata.cached).toBe(true);
    expect(spy).not.toHaveBeenCalled();
  });

  it('does not deduct credits when the provider fails', async () => {
    const creditsStore = createCreditsStore();
    const usageStore = createUsageStore();

    await expect(
      executeAiTask({
        userId: 'user-1',
        taskType: 'generateCoverLetter',
        input: baseInput,
        provider: createProvider('openrouter', true),
        usageStore,
        creditsStore,
        env: {},
        now: () => new Date('2026-01-01T00:00:00.000Z'),
      }),
    ).rejects.toThrow('provider failed');

    expect(creditsStore.deductions).toBe(0);
    expect(usageStore.logged).toEqual([{ status: 'failed' }]);
  });

  it('returns generated output with Human Review Required', async () => {
    const result = await executeAiTask({
      userId: 'user-1',
      taskType: 'generateCoverLetter',
      input: baseInput,
      provider: createProvider('mock'),
      usageStore: createUsageStore(),
      creditsStore: createCreditsStore(),
      env: {},
      now: () => new Date('2026-01-01T00:00:00.000Z'),
    });

    expect(result.output.safety.humanReviewRequired).toBe('Human Review Required');
  });

  it('marks missing evidence instead of fabricating claims', async () => {
    const result = await executeAiTask({
      userId: 'user-1',
      taskType: 'generateCoverLetter',
      input: { ...baseInput, cvText: '', highlights: [] },
      provider: createProvider('mock'),
      usageStore: createUsageStore(),
      creditsStore: createCreditsStore(),
      env: {},
      now: () => new Date('2026-01-01T00:00:00.000Z'),
    });

    expect(result.output.safety.evidenceMissing.join(' ')).toContain('Evidence needed:');
    expect(result.output.content).not.toContain('increased revenue');
  });
});

describe('ai prompt privacy and cache keys', () => {
  it('builds prompts without contact details or unapproved structured fields', () => {
    const prompt = buildPrompt('generateCoverLetter', {
      ...baseInput,
      cvText:
        'Experience: React dashboards. Email private@example.com. Phone +250 788 123 456. Portfolio https://private.example.com/token.',
      userProfile: 'Product engineer with private email hidden@example.com.',
      notes: 'Use a concise tone.',
      privateSalaryFloor: 'Do not reveal 120000',
      internalUrl: 'https://internal.example.com/private',
    } as AiTaskInput<'generateCoverLetter'> & Record<string, unknown>);

    expect(prompt).toContain('React dashboards');
    expect(prompt).toContain('Frontend Engineer');
    expect(prompt).not.toContain('private@example.com');
    expect(prompt).not.toContain('hidden@example.com');
    expect(prompt).not.toContain('+250 788 123 456');
    expect(prompt).not.toContain('https://private.example.com/token');
    expect(prompt).not.toContain('privateSalaryFloor');
    expect(prompt).not.toContain('internal.example.com');
  });

  it('keys cache entries by opportunity hash, resume/profile version, and generation type', async () => {
    const first = await hashTaskInput('generateCoverLetter', {
      ...baseInput,
      opportunityHash: 'opp-123',
      resumeProfileVersion: 'resume-v1',
      generationType: 'cover-letter',
      cvText: 'Sensitive CV version A',
      jobDescription: 'Sensitive JD version A',
      notes: 'Sensitive notes A',
    } as AiTaskInput<'generateCoverLetter'> & Record<string, unknown>);
    const repeated = await hashTaskInput('generateCoverLetter', {
      ...baseInput,
      opportunityHash: 'opp-123',
      resumeProfileVersion: 'resume-v1',
      generationType: 'cover-letter',
      cvText: 'Sensitive CV version B',
      jobDescription: 'Sensitive JD version B',
      notes: 'Sensitive notes B',
    } as AiTaskInput<'generateCoverLetter'> & Record<string, unknown>);
    const changedResume = await hashTaskInput('generateCoverLetter', {
      ...baseInput,
      opportunityHash: 'opp-123',
      resumeProfileVersion: 'resume-v2',
      generationType: 'cover-letter',
      cvText: 'Sensitive CV version B',
      jobDescription: 'Sensitive JD version B',
    } as AiTaskInput<'generateCoverLetter'> & Record<string, unknown>);

    expect(repeated).toBe(first);
    expect(changedResume).not.toBe(first);
  });
});
