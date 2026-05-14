import { supabase } from '@/lib/supabaseClient';
import type { TailoredResumeStructured } from '@jata/common';

export type AiProviderMode = 'none' | 'mock' | 'huggingface' | 'openrouter';

export type AiTaskType =
  | 'analyzeCvMatch'
  | 'suggestResumeImprovements'
  | 'generateCoverLetter'
  | 'generateRecruiterMessage'
  | 'generateFollowUpMessage'
  | 'summarizeOpportunity'
  | 'generateTailoredResume';

export interface AiSafetySections {
  humanReviewRequired: string;
  claimsToVerifyBeforeSending: string[];
  evidenceMissing: string[];
  suggestedEdits: string[];
}

export interface AiOutputMetadata {
  provider: AiProviderMode;
  model: string;
  generatedAt: string;
  cached: boolean;
}

export interface AiTextOutput {
  content: string;
  safety: AiSafetySections;
}

export interface AiTailoredResumeOutput {
  structured: TailoredResumeStructured;
  markdown: string;
  safety: AiSafetySections;
}

export interface AiMatchOutput {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  suggestions: string[];
  atsScore?: number;
  atsIssues?: string[];
  safety: AiSafetySections;
}

export interface AiOutputPayload<TOutput = AiTextOutput | AiMatchOutput | AiTailoredResumeOutput> {
  taskType: AiTaskType;
  output: TOutput;
  metadata: AiOutputMetadata;
}

function addLegacyTailoredResumeContent<TOutput>(
  taskType: AiTaskType,
  payload: AiOutputPayload<TOutput>,
): AiOutputPayload<TOutput> {
  if (taskType !== 'generateTailoredResume') return payload;

  const output = payload.output as AiTailoredResumeOutput & { content?: string };
  if (!output?.structured || output.content) return payload;

  return {
    ...payload,
    output: {
      ...output,
      content: JSON.stringify(output.structured),
    },
  } as AiOutputPayload<TOutput>;
}

/** Calls the server-side AI Edge Function without exposing provider keys. */
export async function invokeAiTask<TOutput>(
  taskType: AiTaskType,
  input: Record<string, unknown>,
): Promise<AiOutputPayload<TOutput>> {
  const { data, error } = await supabase.functions.invoke<AiOutputPayload<TOutput>>('ai-generate', {
    body: {
      taskType,
      input,
    },
  });

  if (error) {
    throw new Error(error.message || 'AI request failed');
  }

  if (!data) {
    throw new Error('AI request returned no data');
  }

  return addLegacyTailoredResumeContent(taskType, data);
}

/** Creates fallback safety sections for local-only deterministic results. */
export function createFallbackSafety(evidenceMissing: string[] = []): AiSafetySections {
  return {
    humanReviewRequired: 'Human Review Required',
    claimsToVerifyBeforeSending: [
      'Confirm that each claim appears in your CV, profile, job description, or notes.',
      'Confirm company name, role title, dates, and metrics before sending.',
    ],
    evidenceMissing: evidenceMissing.length
      ? evidenceMissing
      : ['Evidence needed: verify supporting proof before sending.'],
    suggestedEdits: [
      'Remove unsupported claims.',
      'Add concrete proof from your CV or notes before sending.',
    ],
  };
}

/** Formats safety sections for visible generated output. */
export function formatSafetySections(safety: AiSafetySections): string {
  return [
    'Human Review Required',
    'Review before sending.',
    '',
    'Claims to Verify Before Sending',
    ...safety.claimsToVerifyBeforeSending.map((claim) => `- ${claim}`),
    '',
    'Evidence Missing',
    ...safety.evidenceMissing.map((item) => `- ${item}`),
    '',
    'Suggested Edits',
    ...safety.suggestedEdits.map((item) => `- ${item}`),
  ].join('\n');
}

/** Appends required review sections when fallback content is generated locally. */
export function appendSafetySections(content: string, safety: AiSafetySections): string {
  if (content.includes('Human Review Required')) {
    return content;
  }

  return `${content.trim()}\n\n${formatSafetySections(safety)}`;
}

/** Formats AI metadata for compact UI display. */
export function formatAiGeneratedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
