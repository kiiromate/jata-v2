import type { ApplicationPackDocument, TailoredResumeContent } from './types';

export interface PackState {
  candidateName: string;
  candidateEmail?: string;
  roleTitle: string;
  companyName: string;
  sourceUrl?: string;
  coverLetterText?: string | null;
  tailoredResume?: TailoredResumeContent | null;
  claimsToVerify?: string[];
  generatedAt?: string;
}

export function buildCoverLetterDocument(state: PackState): ApplicationPackDocument {
  return {
    documentType: 'cover_letter',
    candidateName: state.candidateName,
    candidateEmail: state.candidateEmail,
    roleTitle: state.roleTitle,
    companyName: state.companyName,
    sourceUrl: state.sourceUrl,
    generatedAt: state.generatedAt ?? new Date().toISOString(),
    coverLetterText: state.coverLetterText ?? '',
    claimsToVerify: state.claimsToVerify,
  };
}

export function buildResumeDocument(state: PackState): ApplicationPackDocument {
  return {
    documentType: 'tailored_resume',
    candidateName: state.candidateName,
    candidateEmail: state.candidateEmail,
    roleTitle: state.roleTitle,
    companyName: state.companyName,
    sourceUrl: state.sourceUrl,
    generatedAt: state.generatedAt ?? new Date().toISOString(),
    tailoredResume: state.tailoredResume ?? undefined,
    claimsToVerify: [
      ...(state.tailoredResume?.structured.claimsToVerify ?? []),
      ...(state.claimsToVerify ?? []),
    ],
  };
}
