import {
  buildPrompt,
  ensureMatchOutputSafety,
  ensureTextOutputSafety,
  outputToText,
} from './content.ts';
import { hashTaskInput, sha256 } from './hash.ts';
import type { AiCreditsStore, AiUsageStore } from './storage.ts';
import type {
  AiEnv,
  AiOutputPayload,
  AiProvider,
  AiTaskInput,
  AiTaskOutput,
  AiTaskType,
} from './types.ts';

interface AiExecutionRequest<T extends AiTaskType> {
  userId: string;
  taskType: T;
  input: AiTaskInput<T>;
  provider: AiProvider;
  usageStore: AiUsageStore;
  creditsStore: AiCreditsStore;
  env: AiEnv;
  now?: () => Date;
}

interface UsageLimits {
  dailyLimit: number;
  monthlyLimit: number;
  maxJdChars: number;
  maxCvChars: number;
  maxProfileChars: number;
  maxPromptChars: number;
  failureCooldownMinutes: number;
  failureCooldownCount: number;
}

/** Converts environment text into a positive integer limit. */
function readLimit(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Reads usage limits with cheap personal-use defaults. */
function getUsageLimits(env: AiEnv): UsageLimits {
  const maxJdChars = readLimit(env.JATA_AI_MAX_JD_CHARS, 12000);
  const maxCvChars = readLimit(env.JATA_AI_MAX_CV_CHARS, 12000);
  const maxProfileChars = readLimit(env.JATA_AI_MAX_PROFILE_CHARS, maxCvChars);

  return {
    dailyLimit: readLimit(env.JATA_AI_DAILY_LIMIT, 20),
    monthlyLimit: readLimit(env.JATA_AI_MONTHLY_LIMIT, 300),
    maxJdChars,
    maxCvChars,
    maxProfileChars,
    maxPromptChars: maxJdChars + maxCvChars + maxProfileChars + 4000,
    failureCooldownMinutes: 15,
    failureCooldownCount: 3,
  };
}

/** Returns a shifted ISO timestamp for usage windows. */
function minutesAgo(now: Date, minutes: number): string {
  return new Date(now.getTime() - minutes * 60 * 1000).toISOString();
}

/** Returns the first day window for daily usage checks. */
function startOfUtcDay(now: Date): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}

/** Returns the first month window for monthly usage checks. */
function startOfUtcMonth(now: Date): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

/** Validates input and prompt sizes before provider calls. */
function validateSizeLimits(input: AiTaskInput, prompt: string, limits: UsageLimits): string | null {
  const jobDescription = input.jobDescription || '';
  const cvText = input.cvText || '';
  const userProfile = input.userProfile || '';

  if (jobDescription.length > limits.maxJdChars) {
    return `Job description is too long. Limit is ${limits.maxJdChars} characters.`;
  }

  if (cvText.length > limits.maxCvChars) {
    return `CV is too long. Limit is ${limits.maxCvChars} characters.`;
  }

  if (userProfile.length > limits.maxProfileChars) {
    return `Profile is too long. Limit is ${limits.maxProfileChars} characters.`;
  }

  if (prompt.length > limits.maxPromptChars) {
    return `AI prompt is too long. Limit is ${limits.maxPromptChars} characters.`;
  }

  return null;
}

/** Calls the correct provider method for a typed task. */
async function callProvider<T extends AiTaskType>(
  provider: AiProvider,
  taskType: T,
  input: AiTaskInput<T>,
): Promise<AiTaskOutput<T>> {
  switch (taskType) {
    case 'analyzeCvMatch':
      return provider.analyzeCvMatch(input as never) as Promise<AiTaskOutput<T>>;
    case 'suggestResumeImprovements':
      return provider.suggestResumeImprovements(input as never) as Promise<AiTaskOutput<T>>;
    case 'generateCoverLetter':
      return provider.generateCoverLetter(input as never) as Promise<AiTaskOutput<T>>;
    case 'generateRecruiterMessage':
      return provider.generateRecruiterMessage(input as never) as Promise<AiTaskOutput<T>>;
    case 'generateFollowUpMessage':
      return provider.generateFollowUpMessage(input as never) as Promise<AiTaskOutput<T>>;
    case 'summarizeOpportunity':
      return provider.summarizeOpportunity(input as never) as Promise<AiTaskOutput<T>>;
    case 'generateTailoredResume':
      return provider.generateTailoredResume(input as never) as Promise<AiTaskOutput<T>>;
    default:
      throw new Error('Unsupported AI task type');
  }
}

/** Ensures required safety fields are present on provider output. */
function ensureOutputSafety<T extends AiTaskType>(
  taskType: T,
  input: AiTaskInput<T>,
  output: AiTaskOutput<T>,
): AiTaskOutput<T> {
  if (taskType === 'analyzeCvMatch') {
    return ensureMatchOutputSafety(output as never, input) as AiTaskOutput<T>;
  }

  return ensureTextOutputSafety(output as never, input, taskType) as AiTaskOutput<T>;
}

/** Logs blocked and failed attempts without raw prompt text. */
async function logNonSuccess<T extends AiTaskType>(
  request: AiExecutionRequest<T>,
  inputHash: string,
  promptCharCount: number,
  status: 'blocked' | 'failed',
  errorMessage: string,
): Promise<void> {
  await request.usageStore.logOutput({
    userId: request.userId,
    provider: request.provider.mode,
    model: request.provider.model || '',
    taskType: request.taskType,
    inputHash,
    outputHash: null,
    promptCharCount,
    responseCharCount: 0,
    latencyMs: 0,
    status,
    errorMessage,
  });
}

/** Executes an AI task with routing, controls, cache, logging, and credits. */
export async function executeAiTask<T extends AiTaskType>(
  request: AiExecutionRequest<T>,
): Promise<AiOutputPayload<T>> {
  const now = request.now?.() || new Date();
  const limits = getUsageLimits(request.env);
  const prompt = buildPrompt(request.taskType, request.input);
  const promptCharCount = prompt.length;
  const inputHash = await hashTaskInput(request.taskType, request.input);
  const sizeError = validateSizeLimits(request.input, prompt, limits);

  if (sizeError) {
    await logNonSuccess(request, inputHash, promptCharCount, 'blocked', sizeError);
    throw new Error(sizeError);
  }

  const cached = await request.usageStore.findCachedOutput(request.userId, request.taskType, inputHash);
  if (cached) {
    return {
      ...cached,
      metadata: {
        ...cached.metadata,
        cached: true,
      },
    } as AiOutputPayload<T>;
  }

  const recentFailures = await request.usageStore.countRecentFailures(
    request.userId,
    minutesAgo(now, limits.failureCooldownMinutes),
  );
  if (recentFailures >= limits.failureCooldownCount) {
    const message = 'AI calls are cooling down after repeated provider failures.';
    await logNonSuccess(request, inputHash, promptCharCount, 'blocked', message);
    throw new Error(message);
  }

  const dailyCount = await request.usageStore.countUserOutputs(request.userId, startOfUtcDay(now));
  if (dailyCount >= limits.dailyLimit) {
    const message = `Daily AI request limit reached. Limit is ${limits.dailyLimit}.`;
    await logNonSuccess(request, inputHash, promptCharCount, 'blocked', message);
    throw new Error(message);
  }

  const monthlyCount = await request.usageStore.countUserOutputs(request.userId, startOfUtcMonth(now));
  if (monthlyCount >= limits.monthlyLimit) {
    const message = `Monthly AI request limit reached. Limit is ${limits.monthlyLimit}.`;
    await logNonSuccess(request, inputHash, promptCharCount, 'blocked', message);
    throw new Error(message);
  }

  const entitlement = await request.creditsStore.checkEntitlement(request.userId);
  if (!entitlement.allowed) {
    const message = entitlement.reason || 'AI credits are not available.';
    await logNonSuccess(request, inputHash, promptCharCount, 'blocked', message);
    throw new Error(message);
  }

  const startedAt = Date.now();
  try {
    const rawOutput = await callProvider(request.provider, request.taskType, request.input);
    const output = ensureOutputSafety(request.taskType, request.input, rawOutput);
    const responseText = outputToText(output);
    const payload: AiOutputPayload<T> = {
      taskType: request.taskType,
      output,
      metadata: {
        provider: request.provider.mode,
        model: request.provider.model || '',
        generatedAt: now.toISOString(),
        cached: false,
      },
    };

    await request.usageStore.logOutput({
      userId: request.userId,
      provider: request.provider.mode,
      model: request.provider.model || '',
      taskType: request.taskType,
      inputHash,
      outputHash: await sha256(responseText),
      promptCharCount,
      responseCharCount: responseText.length,
      latencyMs: Date.now() - startedAt,
      status: 'success',
      outputPayload: payload,
    });

    await request.creditsStore.deductAfterSuccess(request.userId, request.taskType);
    return payload;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown AI provider error';
    await logNonSuccess(request, inputHash, promptCharCount, 'failed', message);
    throw error;
  }
}
