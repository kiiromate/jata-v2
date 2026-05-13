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

export interface AiCacheKeyParts {
  opportunityHash?: string;
  resumeProfileVersion?: string;
  resumeVersion?: string;
  profileVersion?: string;
  generationType?: string;
}

export interface AiBaseInput extends AiCacheKeyParts {
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

export interface GenerateTailoredResumeInput extends AiBaseInput {
  cvText: string;
  jobDescription: string;
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
  generateTailoredResume: GenerateTailoredResumeInput;
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
  generateTailoredResume: AiTextOutput;
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
  generateTailoredResume(input: GenerateTailoredResumeInput): Promise<AiTextOutput>;
}

export type AiEnv = Record<string, string | undefined>;
