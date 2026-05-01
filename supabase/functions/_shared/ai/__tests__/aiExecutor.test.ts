import {
  createAiRouter,
  executeAiTask,
  type AiCreditsStore,
  type AiProvider,
  type AiUsageStore,
} from '../index';
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
function createUsageStore(cachedOutput: AiOutputPayload | null = null): AiUsageStore & {
  logged: Array<{ status: string }>;
} {
  return {
    logged: [],
    async findCachedOutput() {
      return cachedOutput;
    },
    async countUserOutputs() {
      return 0;
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
      usageStore: createUsageStore(cached),
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
