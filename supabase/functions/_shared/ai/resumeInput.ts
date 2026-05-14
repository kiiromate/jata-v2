import type { AiTaskType } from './types.ts';

export type ResumeTextLookup = (resumeId: string, userId: string) => Promise<string | null>;

export type ResumeBackedInput = Record<string, unknown> & {
  resumeId?: string;
  cvText?: string;
};

const CV_TEXT_REQUIRED_TASKS = new Set<AiTaskType>([
  'analyzeCvMatch',
  'suggestResumeImprovements',
  'generateTailoredResume',
]);

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export async function resolveResumeBackedInput<TInput extends ResumeBackedInput>(
  input: TInput,
  userId: string,
  lookupResumeText: ResumeTextLookup,
): Promise<Omit<TInput, 'resumeId'> & { cvText?: string }> {
  const { resumeId, ...taskInput } = input;
  const extractedText = resumeId ? cleanText(await lookupResumeText(resumeId, userId)) : '';
  const requestCvText = cleanText(taskInput.cvText);

  return {
    ...taskInput,
    ...(extractedText || requestCvText ? { cvText: extractedText || requestCvText } : {}),
  } as Omit<TInput, 'resumeId'> & { cvText?: string };
}

export function validateRequiredCvText(taskType: AiTaskType, input: { cvText?: unknown }): string | null {
  if (!CV_TEXT_REQUIRED_TASKS.has(taskType)) return null;
  return cleanText(input.cvText)
    ? null
    : 'CV text is required. Upload a resume with extracted text or include cvText in the request.';
}
