import type {
  AiBaseInput,
  AiMatchOutput,
  AiSafetySections,
  AiTaskInput,
  AiTaskOutput,
  AiTaskType,
  AiTextOutput,
} from './types.ts';

export const HUMAN_REVIEW_REQUIRED = 'Human Review Required';

const SKILLS = [
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'Python',
  'SQL',
  'PostgreSQL',
  'Docker',
  'Kubernetes',
  'AWS',
  'GCP',
  'Azure',
  'HTML',
  'CSS',
  'Tailwind',
  'Project Management',
  'Agile',
  'Scrum',
  'Testing',
  'Analytics',
  'Customer Support',
];

/** Escapes a string so it can be used in a regular expression. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Converts optional text into trimmed safe text. */
function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Removes contact details that are not needed for provider prompts. */
export function sanitizePromptText(value: unknown, maxChars = 4000): string {
  const cleaned = cleanText(value)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted email]')
    .replace(/https?:\/\/[^\s]+|www\.[^\s]+/gi, '[redacted url]')
    .replace(/\+?\d[\d\s().-]{7,}\d/g, '[redacted phone]')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned.length > maxChars ? `${cleaned.slice(0, maxChars)}...` : cleaned;
}

/** Converts an optional string array into clean entries. */
function cleanList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => cleanText(item)).filter(Boolean)
    : [];
}

/** Formats one sanitized prompt field with an explicit missing-evidence fallback. */
function promptLine(label: string, value: unknown, fallback: string, maxChars?: number): string {
  const sanitized = sanitizePromptText(value, maxChars);
  return `${label}: ${sanitized || fallback}`;
}

/** Formats sanitized highlights without carrying unrelated input fields. */
function promptList(label: string, value: unknown, fallback: string): string {
  const items = cleanList(value)
    .map((item) => sanitizePromptText(item, 600))
    .filter(Boolean);

  return `${label}: ${items.length ? items.join('; ') : fallback}`;
}

/** Extracts known skills from text with deterministic matching. */
export function extractKnownSkills(text: string): string[] {
  return SKILLS.filter((skill) => {
    const pattern = new RegExp(`\\b${escapeRegExp(skill)}\\b`, 'i');
    return pattern.test(text);
  });
}

/** Creates safety sections required for every AI output. */
export function buildSafetySections(input: AiBaseInput, taskType: AiTaskType): AiSafetySections {
  const evidenceMissing: string[] = [];
  const claimsToVerifyBeforeSending: string[] = [];
  const suggestedEdits: string[] = [];
  const cvText = cleanText(input.cvText);
  const jobDescription = cleanText(input.jobDescription);
  const userProfile = cleanText(input.userProfile);
  const notes = cleanText(input.notes);
  const highlights = cleanList((input as { highlights?: string[] }).highlights);

  if (!cvText && highlights.length === 0) {
    evidenceMissing.push('Evidence needed: uploaded CV facts or resume highlights.');
  }

  if (!jobDescription) {
    evidenceMissing.push('Evidence needed: job description details.');
  }

  if (!userProfile && !notes) {
    evidenceMissing.push('Evidence needed: user profile facts or user notes for personalization.');
  }

  claimsToVerifyBeforeSending.push('Confirm that each claim appears in the CV, user profile, job description, or user notes.');
  claimsToVerifyBeforeSending.push('Confirm names, company details, role title, and dates before sending.');

  if (!/\d/.test(`${cvText} ${highlights.join(' ')}`)) {
    claimsToVerifyBeforeSending.push('Do not add metrics unless the user has provided the metric.');
    evidenceMissing.push('Evidence needed: measurable result for this role.');
  }

  suggestedEdits.push('Remove any sentence that cannot be traced to provided evidence.');
  suggestedEdits.push('Add concrete proof from the CV or notes before sending.');

  if (taskType === 'analyzeCvMatch') {
    suggestedEdits.push('Use missing skills as review prompts, not as claims to add automatically.');
  }

  return {
    humanReviewRequired: HUMAN_REVIEW_REQUIRED,
    claimsToVerifyBeforeSending,
    evidenceMissing: Array.from(new Set(evidenceMissing)),
    suggestedEdits,
  };
}

/** Formats safety sections as visible text appended to generated content. */
export function formatSafetySections(safety: AiSafetySections): string {
  const claims = safety.claimsToVerifyBeforeSending.map((item: string) => `- ${item}`).join('\n');
  const evidence = safety.evidenceMissing.map((item: string) => `- ${item}`).join('\n');
  const edits = safety.suggestedEdits.map((item: string) => `- ${item}`).join('\n');

  return [
    HUMAN_REVIEW_REQUIRED,
    'Review before sending.',
    '',
    'Claims to Verify Before Sending',
    claims || '- Confirm all claims before sending.',
    '',
    'Evidence Missing',
    evidence || '- Evidence needed: none identified from provided inputs.',
    '',
    'Suggested Edits',
    edits || '- Tighten wording before sending.',
  ].join('\n');
}

/** Appends safety sections if the content does not already include them. */
export function withSafetyText(content: string, safety: AiSafetySections): string {
  const cleaned = cleanText(content);
  if (cleaned.includes(HUMAN_REVIEW_REQUIRED) && cleaned.includes('Claims to Verify Before Sending')) {
    return cleaned;
  }

  return `${cleaned || 'Evidence needed: source facts before drafting.'}\n\n${formatSafetySections(safety)}`;
}

/** Ensures a text output contains all required safety fields and visible sections. */
export function ensureTextOutputSafety(
  output: AiTextOutput,
  input: AiBaseInput,
  taskType: AiTaskType,
): AiTextOutput {
  const safety = {
    ...buildSafetySections(input, taskType),
    ...output.safety,
    humanReviewRequired: HUMAN_REVIEW_REQUIRED,
  };

  return {
    content: withSafetyText(output.content, safety),
    safety,
  };
}

/** Ensures a match output contains all required safety fields. */
export function ensureMatchOutputSafety(output: AiMatchOutput, input: AiBaseInput): AiMatchOutput {
  const safety = {
    ...buildSafetySections(input, 'analyzeCvMatch'),
    ...output.safety,
    humanReviewRequired: HUMAN_REVIEW_REQUIRED,
  };

  return {
    ...output,
    safety,
  };
}

/** Creates a deterministic CV match result from supplied CV and job facts. */
export function createDeterministicMatchOutput(input: AiBaseInput): AiMatchOutput {
  const cvText = cleanText(input.cvText);
  const jobDescription = cleanText(input.jobDescription);
  const jobSkills = extractKnownSkills(jobDescription);
  const cvSkills = extractKnownSkills(cvText);
  const matchedSkills = jobSkills.filter((skill) => cvSkills.includes(skill));
  const missingSkills = jobSkills.filter((skill) => !cvSkills.includes(skill));
  const score = jobSkills.length > 0 ? Math.round((matchedSkills.length / jobSkills.length) * 100) : 0;
  const atsIssues: string[] = [];

  if (!/@/.test(cvText)) atsIssues.push('Missing email address.');
  if (!/\d/.test(cvText)) atsIssues.push('Missing measurable achievements.');
  if (!/experience/i.test(cvText)) atsIssues.push('Missing experience section.');

  return ensureMatchOutputSafety(
    {
      score,
      matchedSkills,
      missingSkills,
      suggestions: missingSkills.length
        ? missingSkills.map((skill) => `Add ${skill} only if you have direct evidence for it.`)
        : ['Use the matched skills as prompts for manual review.'],
      atsScore: Math.max(0, 100 - atsIssues.length * 15),
      atsIssues,
      safety: buildSafetySections(input, 'analyzeCvMatch'),
    },
    input,
  );
}

/** Creates a deterministic text draft without adding unsupported claims. */
export function createDeterministicTextOutput(
  input: AiBaseInput,
  taskType: AiTaskType,
  title: string,
): AiTextOutput {
  const safety = buildSafetySections(input, taskType);
  const companyName = cleanText((input as { companyName?: string }).companyName) || 'the company';
  const jobTitle = cleanText((input as { jobTitle?: string }).jobTitle) || 'the role';
  const highlights = cleanList((input as { highlights?: string[] }).highlights);
  const firstEvidence = highlights[0] || extractKnownSkills(cleanText(input.cvText))[0] || '';
  const evidenceLine = firstEvidence
    ? `Relevant evidence provided: ${firstEvidence}.`
    : 'Evidence needed: relevant CV fact for this role.';
  const jobLine = cleanText(input.jobDescription)
    ? `Role context: ${jobTitle} at ${companyName}.`
    : `Evidence needed: job description details for ${jobTitle} at ${companyName}.`;
  const noteLine = cleanText(input.notes)
    ? `User note to preserve: ${cleanText(input.notes)}`
    : 'Evidence needed: user notes for stronger personalization.';
  const content = [title, '', jobLine, evidenceLine, noteLine].join('\n');

  return ensureTextOutputSafety({ content, safety }, input, taskType);
}

/** Creates a local manual fallback when AI generation is explicitly disabled. */
export function createNoAiTextOutput(
  input: AiBaseInput,
  taskType: AiTaskType,
  title: string,
): AiTextOutput {
  const safety = buildSafetySections(input, taskType);
  const companyName = cleanText((input as { companyName?: string }).companyName) || 'the company';
  const jobTitle = cleanText((input as { jobTitle?: string }).jobTitle) || 'the role';
  const highlights = cleanList((input as { highlights?: string[] }).highlights);
  const evidenceLine = highlights[0] || extractKnownSkills(cleanText(input.cvText))[0] || 'Evidence needed: source fact.';
  const content = [
    title,
    '',
    'AI generation is disabled. Use this manual fallback as a review checklist only.',
    `Role context: ${jobTitle} at ${companyName}.`,
    `Evidence to verify: ${evidenceLine}.`,
    'Next action: draft manually from the verified CV, profile, job description, and notes.',
  ].join('\n');

  return ensureTextOutputSafety({ content, safety }, input, taskType);
}

/** Builds the provider prompt while excluding secrets and raw persistence details. */
export function buildPrompt<T extends AiTaskType>(taskType: T, input: AiTaskInput<T>): string {
  const baseInstructions = [
    'You are JATA AI for job application tailoring.',
    'Use only uploaded CV facts, user profile facts, job description facts, and user-provided notes.',
    'Do not fabricate claims, metrics, employers, credentials, dates, or outcomes.',
    'If evidence is missing, write: Evidence needed: [specific missing proof].',
    'Every generated output must include these sections:',
    HUMAN_REVIEW_REQUIRED,
    'Claims to Verify Before Sending',
    'Evidence Missing',
    'Suggested Edits',
  ].join('\n');

  return [
    baseInstructions,
    '',
    `Task: ${taskType}`,
    promptLine('Role title', (input as { jobTitle?: string }).jobTitle, 'Evidence needed: role title.', 200),
    promptLine('Company', (input as { companyName?: string }).companyName, 'Evidence needed: company name.', 200),
    promptLine('Applicant name', (input as { userName?: string }).userName, 'Use neutral applicant wording.', 200),
    promptLine(
      'Recipient name',
      (input as { recruiterName?: string; contactName?: string }).recruiterName ||
        (input as { recruiterName?: string; contactName?: string }).contactName,
      'Use a neutral salutation.',
      200,
    ),
    promptLine('Tone', (input as { tone?: string }).tone, 'professional', 80),
    promptList('Verified highlights', (input as { highlights?: string[] }).highlights, 'Evidence needed: verified highlights.'),
    promptLine('CV facts', input.cvText, 'Evidence needed: uploaded CV facts.', 4000),
    promptLine('User profile facts', input.userProfile, 'Evidence needed: user profile facts.', 2000),
    promptLine('Job description facts', input.jobDescription, 'Evidence needed: job description facts.', 4000),
    promptLine('User notes', input.notes, 'Evidence needed: user notes if customization is required.', 1200),
    promptLine(
      'Previous interaction',
      (input as { previousInteraction?: string }).previousInteraction,
      'Evidence needed: previous interaction context if follow-up is required.',
      1200,
    ),
  ].join('\n');
}

/** Builds the structured JSON prompt for tailored resume generation. */
export function buildTailoredResumePrompt(input: AiBaseInput): string {
  const systemInstruction = [
    'You are a professional resume writer. Your only source of truth is the candidate\'s existing resume text.',
    'Do NOT invent or add any experience, employer, date, metric, tool, certification, education, location,',
    'eligibility, or claim that does not appear in the provided resume. If a keyword from the job description',
    'would strengthen the resume but cannot be verified from the existing content, add it to claimsToVerify only.',
    '',
    'Return a JSON object with this exact shape (no markdown fences, raw JSON only):',
    '{',
    '  "summary": "2-3 sentence professional summary tailored to the role",',
    '  "skills": ["skill1", "skill2"],',
    '  "experience": [',
    '    { "role": "Job Title", "company": "Company", "location": "City, Country or Remote", "dates": "Month Year – Month Year", "bullets": ["bullet 1"] }',
    '  ],',
    '  "education": [',
    '    { "degree": "Degree name", "institution": "School name", "dates": "Year" }',
    '  ],',
    '  "projects_or_additional": ["item 1"],',
    '  "claimsToVerify": ["anything the AI is uncertain about that the candidate must verify before using"]',
    '}',
  ].join('\n');

  const jobTitle = cleanText((input as { jobTitle?: string }).jobTitle) || 'the role';
  const companyName = cleanText((input as { companyName?: string }).companyName) || 'the company';
  const cvText = sanitizePromptText(input.cvText, 10000);
  const jobDescription = sanitizePromptText(input.jobDescription, 6000);

  return [
    systemInstruction,
    '',
    `Target role: ${jobTitle} at ${companyName}`,
    '',
    'Candidate resume:',
    cvText || 'Evidence needed: no CV text provided.',
    '',
    'Job description:',
    jobDescription || 'Evidence needed: no job description provided.',
  ].join('\n');
}

/** Creates a stub tailored resume JSON output for offline/mock providers. */
export function createStubTailoredResumeOutput(input: AiBaseInput): AiTextOutput {
  const safety = buildSafetySections(input, 'generateTailoredResume' as AiTaskType);
  const stub = JSON.stringify({
    summary: 'Evidence needed: source professional summary from your CV before using.',
    skills: [],
    experience: [],
    education: [],
    projects_or_additional: [],
    claimsToVerify: ['AI generation was unavailable. Please review and complete this resume manually.'],
  });
  return { content: stub, safety };
}

/** Extracts plain text from any typed AI output for hashing and character counts. */
export function outputToText(output: AiTaskOutput): string {
  if ('content' in output) return output.content;
  return [
    `Score: ${output.score}`,
    `Matched: ${output.matchedSkills.join(', ')}`,
    `Missing: ${output.missingSkills.join(', ')}`,
    `Suggestions: ${output.suggestions.join(', ')}`,
    formatSafetySections(output.safety),
  ].join('\n');
}
