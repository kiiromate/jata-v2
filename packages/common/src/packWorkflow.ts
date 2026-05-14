export const PackReadinessStatuses = ['draft', 'needs_review', 'ready', 'used'] as const;

export type PackReadinessStatus = (typeof PackReadinessStatuses)[number];

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

export interface ApplicationPackWorkflowInput {
  roleTitle?: string | null;
  company?: string | null;
  resumeText?: string | null;
  jobDescription?: string | null;
  matchedSkills?: string[];
  missingSkills?: string[];
  atsIssues?: string[];
}

export interface ApplicationPackSections {
  coverLetter: string;
  shortIntro: string;
  customQuestionAnswers: string;
  recruiterMessage: string;
  followUpMessage: string;
  notes: string;
}

export interface ApplicationPackWorkflow {
  status: PackReadinessStatus;
  claimsToVerify: string[];
  sections: ApplicationPackSections;
}

function clean(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.replace(/\s+/g, ' ').trim();
  return trimmed || fallback;
}

function listOrFallback(values: string[] | undefined, fallback: string): string {
  const cleaned = values?.map((value) => clean(value, '')).filter(Boolean) ?? [];
  return cleaned.length ? cleaned.join(', ') : fallback;
}

function firstSentence(value: string | null | undefined, fallback: string): string {
  const cleaned = clean(value, fallback);
  const match = cleaned.match(/^(.{24,220}?[.!?])\s/);
  return match?.[1] ?? cleaned.slice(0, 220);
}

export function buildApplicationPackWorkflow(
  input: ApplicationPackWorkflowInput,
): ApplicationPackWorkflow {
  const roleTitle = clean(input.roleTitle, 'the role');
  const company = clean(input.company, 'your team');
  const resumeSignal = firstSentence(
    input.resumeText,
    'I bring relevant experience that should be verified against my resume before sending.',
  );
  const jobSignal = firstSentence(
    input.jobDescription,
    'The role calls for focused execution, clear communication, and reliable delivery.',
  );
  const matchedSkills = listOrFallback(input.matchedSkills, 'relevant experience');
  const missingSkills = input.missingSkills?.map((skill) => clean(skill, '')).filter(Boolean) ?? [];
  const atsIssues = input.atsIssues?.map((issue) => clean(issue, '')).filter(Boolean) ?? [];
  const claimsToVerify = [
    'Verify every metric, employer name, credential, and date before sending.',
    'Confirm the company name, role title, recipient, and application deadline.',
    ...missingSkills.map(
      (skill) => `Do not claim ${skill} experience unless it is supported by the resume or notes.`,
    ),
    ...atsIssues.map((issue) => `Resolve or consciously accept ATS issue: ${issue}`),
  ];

  return {
    status: claimsToVerify.length > 2 ? 'needs_review' : 'draft',
    claimsToVerify,
    sections: {
      coverLetter: [
        'Dear Hiring Team,',
        '',
        `I am applying for the ${roleTitle} position at ${company}. ${resumeSignal}`,
        '',
        `What stands out about this opportunity is: ${jobSignal}`,
        '',
        `The strongest verified fit points to emphasize are ${matchedSkills}. I would welcome the chance to discuss how my background can support the team.`,
        '',
        'Sincerely,',
      ].join('\n'),
      shortIntro: `I am interested in the ${roleTitle} role at ${company}. My strongest verified fit points are ${matchedSkills}.`,
      customQuestionAnswers: [
        'Use only verified resume facts and user notes when answering custom questions.',
        `Role focus: ${roleTitle} at ${company}.`,
        `Relevant evidence to reuse: ${resumeSignal}`,
        missingSkills.length
          ? `Do not overclaim these areas without proof: ${missingSkills.join(', ')}.`
          : 'No specific missing-skill warnings were detected.',
      ].join('\n'),
      recruiterMessage: `Hi, I am interested in the ${roleTitle} role at ${company}. Based on the job description, my most relevant verified experience is ${matchedSkills}. I would be glad to share more context if helpful.`,
      followUpMessage: `Hi, I am following up on my application for the ${roleTitle} role at ${company}. I remain interested and would welcome any update on the hiring process.`,
      notes: [
        'Review before sending.',
        `Resume evidence: ${resumeSignal}`,
        `Job evidence: ${jobSignal}`,
      ].join('\n'),
    },
  };
}
