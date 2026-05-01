import {
  buildPrompt,
  createDeterministicMatchOutput,
  ensureTextOutputSafety,
} from '../content.ts';
import type {
  AiEnv,
  AiProvider,
  AiTaskType,
  AiTextOutput,
  AnalyzeCvMatchInput,
  GenerateCoverLetterInput,
  GenerateFollowUpMessageInput,
  GenerateRecruiterMessageInput,
  SuggestResumeImprovementsInput,
  SummarizeOpportunityInput,
} from '../types.ts';

const HF_API_URL = 'https://api-inference.huggingface.co/models';
const HF_TEXT_MODEL = 'HuggingFaceH4/zephyr-7b-beta';

/** Reads the Hugging Face API key from server-side environment values. */
function getApiKey(env: AiEnv): string {
  return env.HUGGINGFACE_API_KEY || '';
}

/** Extracts generated text from Hugging Face response formats. */
function parseHuggingFaceText(result: unknown): string {
  if (Array.isArray(result)) {
    const first = result[0] as { generated_text?: string } | undefined;
    return first?.generated_text || '';
  }

  if (result && typeof result === 'object' && 'generated_text' in result) {
    return String((result as { generated_text?: string }).generated_text || '');
  }

  return '';
}

/** Creates a server-side Hugging Face provider that matches the existing text generation flow. */
export function createHuggingFaceProvider(env: AiEnv, fetchFn: typeof fetch = fetch): AiProvider {
  const apiKey = getApiKey(env);

  /** Calls the Hugging Face Inference API for text generation. */
  async function generateText<T extends AiTaskType>(taskType: T, input: Parameters<AiProvider[T]>[0]): Promise<AiTextOutput> {
    if (!apiKey) {
      throw new Error('Hugging Face API key not configured');
    }

    const prompt = buildPrompt(taskType, input as never);
    const response = await fetchFn(`${HF_API_URL}/${HF_TEXT_MODEL}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 650,
          temperature: 0.3,
          return_full_text: false,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
    }

    const content = parseHuggingFaceText(await response.json());
    return ensureTextOutputSafety({ content, safety: { humanReviewRequired: '', claimsToVerifyBeforeSending: [], evidenceMissing: [], suggestedEdits: [] } }, input as never, taskType);
  }

  return {
    mode: 'huggingface',
    model: HF_TEXT_MODEL,
    async analyzeCvMatch(input: AnalyzeCvMatchInput) {
      return createDeterministicMatchOutput(input);
    },
    async suggestResumeImprovements(input: SuggestResumeImprovementsInput) {
      return generateText('suggestResumeImprovements', input);
    },
    async generateCoverLetter(input: GenerateCoverLetterInput) {
      return generateText('generateCoverLetter', input);
    },
    async generateRecruiterMessage(input: GenerateRecruiterMessageInput) {
      return generateText('generateRecruiterMessage', input);
    },
    async generateFollowUpMessage(input: GenerateFollowUpMessageInput) {
      return generateText('generateFollowUpMessage', input);
    },
    async summarizeOpportunity(input: SummarizeOpportunityInput) {
      return generateText('summarizeOpportunity', input);
    },
  };
}
