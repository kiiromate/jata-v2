export type AiProviderMode = 'mock' | 'huggingface' | 'openrouter';

export type AiTaskType =
  | 'analyzeCvMatch'
  | 'suggestResumeImprovements'
  | 'generateCoverLetter'
  | 'generateRecruiterMessage'
  | 'generateFollowUpMessage'
  | 'summarizeOpportunity';

export interface AiSafetySections {
  humanReviewRequired: string;
  claimsToVerifyBeforeSending: string[];
  evidenceMissing: string[];
  suggestedEdits: string[];
}

export interface AiBaseInput {
  cvText?: string;
  jobDescription?: string;
  userProfile?: string;
  notes?: string;
}

export interface AnalyzeCvMatchInput extends AiBaseInput {
  cvText: string;
  jobDescription: string;
}

export interface SuggestResumeImprovementsInput extends AiBaseInput {
  cvText: string;
  jobDescription: string;
}

export interface GenerateCoverLetterInput extends AiBaseInput {
  jobTitle: string;
  companyName: string;
  userName: string;
  highlights: string[];
  tone?: 'professional' | 'conversational' | 'formal';
}

export interface GenerateRecruiterMessageInput extends AiBaseInput {
  jobTitle?: string;
  companyName?: string;
  recruiterName?: string;
  highlights?: string[];
}

export interface GenerateFollowUpMessageInput extends AiBaseInput {
  jobTitle?: string;
  companyName?: string;
  contactName?: string;
  previousInteraction?: string;
}

export interface SummarizeOpportunityInput extends AiBaseInput {
  jobTitle?: string;
  companyName?: string;
}

export interface AiTaskInputMap {
  analyzeCvMatch: AnalyzeCvMatchInput;
  suggestResumeImprovements: SuggestResumeImprovementsInput;
  generateCoverLetter: GenerateCoverLetterInput;
  generateRecruiterMessage: GenerateRecruiterMessageInput;
  generateFollowUpMessage: GenerateFollowUpMessageInput;
  summarizeOpportunity: SummarizeOpportunityInput;
}

export type AiTaskInput<T extends AiTaskType = AiTaskType> = AiTaskInputMap[T];

export interface AiMatchOutput {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  suggestions: string[];
  atsScore?: number;
  atsIssues?: string[];
  safety: AiSafetySections;
}

export interface AiTextOutput {
  content: string;
  safety: AiSafetySections;
}

export interface AiTaskOutputMap {
  analyzeCvMatch: AiMatchOutput;
  suggestResumeImprovements: AiTextOutput;
  generateCoverLetter: AiTextOutput;
  generateRecruiterMessage: AiTextOutput;
  generateFollowUpMessage: AiTextOutput;
  summarizeOpportunity: AiTextOutput;
}

export type AiTaskOutput<T extends AiTaskType = AiTaskType> = AiTaskOutputMap[T];

export interface AiOutputMetadata {
  provider: AiProviderMode;
  model: string;
  generatedAt: string;
  cached: boolean;
}

export interface AiOutputPayload<T extends AiTaskType = AiTaskType> {
  taskType: T;
  output: AiTaskOutput<T>;
  metadata: AiOutputMetadata;
}

export interface AiProvider {
  mode: AiProviderMode;
  model: string;
  analyzeCvMatch(input: AnalyzeCvMatchInput): Promise<AiMatchOutput>;
  suggestResumeImprovements(input: SuggestResumeImprovementsInput): Promise<AiTextOutput>;
  generateCoverLetter(input: GenerateCoverLetterInput): Promise<AiTextOutput>;
  generateRecruiterMessage(input: GenerateRecruiterMessageInput): Promise<AiTextOutput>;
  generateFollowUpMessage(input: GenerateFollowUpMessageInput): Promise<AiTextOutput>;
  summarizeOpportunity(input: SummarizeOpportunityInput): Promise<AiTextOutput>;
}

export type AiEnv = Record<string, string | undefined>;
