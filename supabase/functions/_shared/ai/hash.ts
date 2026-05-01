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

/** Creates a task input hash for duplicate cache lookups. */
export async function hashTaskInput<T extends AiTaskType>(
  taskType: T,
  input: AiTaskInput<T>,
): Promise<string> {
  return sha256(stableStringify({ taskType, input }));
}
