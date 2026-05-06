import type { AiTaskInput, AiTaskType } from './types.ts';

/** Stable stringifies values so hashes are deterministic across runtimes. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  const entries = keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`);
  return `{${entries.join(',')}}`;
}

/** Creates a SHA-256 hash for text without exposing the source text. */
export async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/** Converts cache metadata to a stable non-empty string. */
function cleanCachePart(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Creates a fallback hash for opportunity identity without storing raw job data. */
async function fallbackOpportunityHash<T extends AiTaskType>(taskType: T, input: AiTaskInput<T>): Promise<string> {
  return sha256(stableStringify({
    taskType,
    companyName: (input as { companyName?: string }).companyName || '',
    jobTitle: (input as { jobTitle?: string }).jobTitle || '',
    jobDescription: input.jobDescription || '',
  }));
}

/** Creates a fallback hash for resume/profile identity without storing raw profile data. */
async function fallbackResumeProfileVersion<T extends AiTaskType>(input: AiTaskInput<T>): Promise<string> {
  return sha256(stableStringify({
    cvText: input.cvText || '',
    userProfile: input.userProfile || '',
    highlights: (input as { highlights?: string[] }).highlights || [],
  }));
}

/** Builds the cache key parts required for duplicate generation lookup. */
export async function buildTaskCacheKey<T extends AiTaskType>(
  taskType: T,
  input: AiTaskInput<T>,
): Promise<{
  opportunityHash: string;
  resumeProfileVersion: string;
  generationType: string;
}> {
  const opportunityHash = cleanCachePart(input.opportunityHash) || (await fallbackOpportunityHash(taskType, input));
  const resumeProfileVersion =
    cleanCachePart(input.resumeProfileVersion) ||
    cleanCachePart(input.resumeVersion) ||
    cleanCachePart(input.profileVersion) ||
    (await fallbackResumeProfileVersion(input));
  const generationType = cleanCachePart(input.generationType) || taskType;

  return {
    opportunityHash,
    resumeProfileVersion,
    generationType,
  };
}

/** Creates a task cache hash from opportunity, resume/profile version, and generation type. */
export async function hashTaskInput<T extends AiTaskType>(
  taskType: T,
  input: AiTaskInput<T>,
): Promise<string> {
  return sha256(stableStringify(await buildTaskCacheKey(taskType, input)));
}
