export interface TailoredResumeExperience {
  role: string;
  company: string;
  location: string;
  dates: string;
  bullets: string[];
}

export interface TailoredResumeStructured {
  summary: string;
  skills: string[];
  experience: TailoredResumeExperience[];
  education: Array<{ degree: string; institution: string; dates: string }>;
  projects_or_additional: string[];
  claimsToVerify: string[];
}

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
