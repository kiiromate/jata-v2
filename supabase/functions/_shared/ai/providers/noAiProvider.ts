import {
  createDeterministicMatchOutput,
  createNoAiTextOutput,
} from '../content.ts';
import type {
  AiProvider,
  AnalyzeCvMatchInput,
  GenerateCoverLetterInput,
  GenerateFollowUpMessageInput,
  GenerateRecruiterMessageInput,
  SuggestResumeImprovementsInput,
  SummarizeOpportunityInput,
} from '../types.ts';

/** Creates the explicit no-AI provider for offline or privacy-sensitive mode. */
export function createNoAiProvider(): AiProvider {
  return {
    mode: 'none',
    model: 'ai-disabled',
    async analyzeCvMatch(input: AnalyzeCvMatchInput) {
      return createDeterministicMatchOutput(input);
    },
    async suggestResumeImprovements(input: SuggestResumeImprovementsInput) {
      return createNoAiTextOutput(input, 'suggestResumeImprovements', 'No-AI resume improvement fallback');
    },
    async generateCoverLetter(input: GenerateCoverLetterInput) {
      return createNoAiTextOutput(input, 'generateCoverLetter', 'No-AI cover letter fallback');
    },
    async generateRecruiterMessage(input: GenerateRecruiterMessageInput) {
      return createNoAiTextOutput(input, 'generateRecruiterMessage', 'No-AI recruiter message fallback');
    },
    async generateFollowUpMessage(input: GenerateFollowUpMessageInput) {
      return createNoAiTextOutput(input, 'generateFollowUpMessage', 'No-AI follow-up fallback');
    },
    async summarizeOpportunity(input: SummarizeOpportunityInput) {
      return createNoAiTextOutput(input, 'summarizeOpportunity', 'No-AI opportunity summary fallback');
    },
  };
}
