import {
  createDeterministicMatchOutput,
  createDeterministicTextOutput,
  createStubTailoredResumeOutput,
} from '../content.ts';
import type {
  AiProvider,
  AnalyzeCvMatchInput,
  GenerateCoverLetterInput,
  GenerateFollowUpMessageInput,
  GenerateTailoredResumeInput,
  GenerateRecruiterMessageInput,
  SuggestResumeImprovementsInput,
  SummarizeOpportunityInput,
} from '../types.ts';

/** Creates the deterministic offline provider used for local development. */
export function createMockProvider(): AiProvider {
  return {
    mode: 'mock',
    model: 'mock-deterministic-local',
    async analyzeCvMatch(input: AnalyzeCvMatchInput) {
      return createDeterministicMatchOutput(input);
    },
    async suggestResumeImprovements(input: SuggestResumeImprovementsInput) {
      return createDeterministicTextOutput(input, 'suggestResumeImprovements', 'Resume improvement draft');
    },
    async generateCoverLetter(input: GenerateCoverLetterInput) {
      return createDeterministicTextOutput(input, 'generateCoverLetter', 'Cover letter draft');
    },
    async generateRecruiterMessage(input: GenerateRecruiterMessageInput) {
      return createDeterministicTextOutput(input, 'generateRecruiterMessage', 'Recruiter message draft');
    },
    async generateFollowUpMessage(input: GenerateFollowUpMessageInput) {
      return createDeterministicTextOutput(input, 'generateFollowUpMessage', 'Follow up message draft');
    },
    async summarizeOpportunity(input: SummarizeOpportunityInput) {
      return createDeterministicTextOutput(input, 'summarizeOpportunity', 'Opportunity summary');
    },
    async generateTailoredResume(input: GenerateTailoredResumeInput) {
      return createStubTailoredResumeOutput(input);
    },
  };
}
