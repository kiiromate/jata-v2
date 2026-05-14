import type { TailoredResumeStructured } from '@jata/common';

export type { TailoredResumeExperience, TailoredResumeStructured } from '@jata/common';

export interface TailoredResumeContent {
  structured: TailoredResumeStructured;
  markdown: string;
}

export interface ApplicationPackDocument {
  documentType: 'cover_letter' | 'tailored_resume';
  candidateName: string;
  candidateEmail?: string;
  roleTitle: string;
  companyName: string;
  sourceUrl?: string;
  generatedAt: string;
  coverLetterText?: string;
  tailoredResume?: TailoredResumeContent;
  claimsToVerify?: string[];
}

export interface IDocumentExporter {
  exportCoverLetter(doc: ApplicationPackDocument): Promise<void>;
  exportResume(doc: ApplicationPackDocument): Promise<void>;
}
