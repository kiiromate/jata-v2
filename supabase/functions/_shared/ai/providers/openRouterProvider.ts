import {
  buildPrompt,
  buildTailoredResumePrompt,
  createTailoredResumeOutputFromStructured,
  createDeterministicMatchOutput,
  ensureTextOutputSafety,
  parseTailoredResumeJson,
} from '../content.ts';
import type {
  AiEnv,
  AiProvider,
  AiTailoredResumeOutput,
  AiTaskType,
  AiTextOutput,
  AnalyzeCvMatchInput,
  GenerateCoverLetterInput,
  GenerateFollowUpMessageInput,
  GenerateTailoredResumeInput,
  GenerateRecruiterMessageInput,
  SuggestResumeImprovementsInput,
  SummarizeOpportunityInput,
} from '../types.ts';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/** Reads the OpenRouter API key from server-side environment values. */
function getApiKey(env: AiEnv): string {
  return env.OPENROUTER_API_KEY || '';
}

/** Reads the configured OpenRouter model without hardcoding a paid model. */
function getModel(env: AiEnv): string {
  return env.JATA_AI_MODEL_DEFAULT || '';
}

/** Extracts generated text from the OpenRouter chat completion response. */
function parseOpenRouterText(result: unknown): string {
  const choice = (result as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0];
  return choice?.message?.content || '';
}

/** Creates a server-side OpenRouter provider for cheap configurable models. */
export function createOpenRouterProvider(env: AiEnv, fetchFn: typeof fetch = fetch): AiProvider {
  const apiKey = getApiKey(env);
  const model = getModel(env);

  /** Calls the OpenRouter API for text generation. */
  async function generateText<T extends AiTaskType>(taskType: T, input: Parameters<AiProvider[T]>[0]): Promise<AiTextOutput> {
    if (!apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    if (!model) {
      throw new Error('JATA_AI_MODEL_DEFAULT is required for OpenRouter');
    }

    const prompt = buildPrompt(taskType, input as never);
    const response = await fetchFn(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'JATA',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a cautious job application drafting assistant. Use only supplied evidence.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const content = parseOpenRouterText(await response.json());
    return ensureTextOutputSafety({ content, safety: { humanReviewRequired: '', claimsToVerifyBeforeSending: [], evidenceMissing: [], suggestedEdits: [] } }, input as never, taskType);
  }

  return {
    mode: 'openrouter',
    model,
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
    async generateTailoredResume(input: GenerateTailoredResumeInput): Promise<AiTailoredResumeOutput> {
      if (!apiKey) throw new Error('OpenRouter API key not configured');
      if (!model) throw new Error('JATA_AI_MODEL_DEFAULT is required for OpenRouter');

      const prompt = buildTailoredResumePrompt(input);
      const response = await fetchFn(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-Title': 'JATA',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are a professional resume writer. Return only valid JSON with no markdown fences. Do not invent any facts not present in the provided resume text.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.1,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const content = parseOpenRouterText(await response.json());
      const structured = parseTailoredResumeJson(content);
      return createTailoredResumeOutputFromStructured(structured, input);
    },
  };
}
