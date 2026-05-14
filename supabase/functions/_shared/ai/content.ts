import type {
  AiBaseInput,
  AiMatchOutput,
  AiSafetySections,
  AiTailoredResumeOutput,
  AiTaskInput,
  AiTaskOutput,
  AiTaskType,
  AiTextOutput,
  TailoredResumeExperience,
  TailoredResumeStructured,
} from './types.ts';
import { quickScore } from '../../../../packages/common/src/scoring/index.ts';

export const HUMAN_REVIEW_REQUIRED = 'Human Review Required';
export const DEFAULT_TAILORED_RESUME_CLAIM =
  'Confirm every tailored resume claim against the original CV before sending.';

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

function uniqueList(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => cleanText(value)).filter(Boolean)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
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

function normalizeClaimsToVerify(value: unknown): string[] {
  const claims = cleanList(value);
  return claims.length ? uniqueList(claims) : [DEFAULT_TAILORED_RESUME_CLAIM];
}

function normalizeExperience(value: unknown): TailoredResumeExperience[] {
  if (!Array.isArray(value)) {
    throw new Error('Tailored resume JSON must include an experience array.');
  }

  return value
    .filter(isRecord)
    .map((item) => ({
      role: cleanText(item.role),
      company: cleanText(item.company),
      location: cleanText(item.location),
      dates: cleanText(item.dates),
      bullets: cleanList(item.bullets),
    }));
}

function normalizeEducation(value: unknown): TailoredResumeStructured['education'] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(isRecord)
    .map((item) => ({
      degree: cleanText(item.degree),
      institution: cleanText(item.institution),
      dates: cleanText(item.dates),
    }));
}

export function normalizeTailoredResumeStructured(value: unknown): TailoredResumeStructured {
  if (!isRecord(value)) {
    throw new Error('Tailored resume output must be a JSON object.');
  }

  if (typeof value.summary !== 'string') {
    throw new Error('Tailored resume JSON must include a string summary.');
  }

  return {
    summary: cleanText(value.summary) || 'Evidence needed: verified professional summary from the CV.',
    skills: cleanList(value.skills),
    experience: normalizeExperience(value.experience),
    education: normalizeEducation(value.education),
    projects_or_additional: cleanList(value.projects_or_additional),
    claimsToVerify: normalizeClaimsToVerify(value.claimsToVerify),
  };
}

function stripJsonFence(value: string): string {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

export function parseTailoredResumeJson(value: string): TailoredResumeStructured {
  const cleaned = stripJsonFence(value);
  try {
    return normalizeTailoredResumeStructured(JSON.parse(cleaned));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Tailored resume output was not valid JSON.';
    throw new Error(`Tailored resume JSON parse failed: ${message}`);
  }
}

export function buildTailoredResumeMarkdown(structured: TailoredResumeStructured): string {
  const lines: string[] = ['## Summary', structured.summary, ''];

  lines.push('## Skills');
  lines.push(structured.skills.length ? structured.skills.map((skill) => `- ${skill}`).join('\n') : '- Evidence needed: verified skills from the CV.');
  lines.push('');

  lines.push('## Experience');
  if (structured.experience.length) {
    for (const item of structured.experience) {
      lines.push(`### ${item.role || 'Evidence needed: role'} | ${item.company || 'Evidence needed: company'}`);
      lines.push([item.location, item.dates].filter(Boolean).join(' | '));
      lines.push(...(item.bullets.length ? item.bullets.map((bullet) => `- ${bullet}`) : ['- Evidence needed: verified achievement bullet.']));
      lines.push('');
    }
  } else {
    lines.push('- Evidence needed: verified experience from the CV.');
    lines.push('');
  }

  lines.push('## Education');
  if (structured.education.length) {
    lines.push(
      ...structured.education.map((item) =>
        `- ${[item.degree, item.institution, item.dates].filter(Boolean).join(' | ')}`,
      ),
    );
  } else {
    lines.push('- Evidence needed: verified education details, if applicable.');
  }
  lines.push('');

  lines.push('## Projects or Additional');
  lines.push(
    structured.projects_or_additional.length
      ? structured.projects_or_additional.map((item) => `- ${item}`).join('\n')
      : '- Evidence needed: verified projects or additional qualifications, if applicable.',
  );
  lines.push('');

  lines.push('## Claims To Verify');
  lines.push(...structured.claimsToVerify.map((claim) => `- ${claim}`));

  return lines.filter((line, index, all) => line || all[index - 1]).join('\n').trim();
}

export function ensureTailoredResumeOutputSafety(
  output: AiTailoredResumeOutput,
  input: AiBaseInput,
): AiTailoredResumeOutput {
  const structured = normalizeTailoredResumeStructured(output.structured);
  const baseSafety = buildSafetySections(input, 'generateTailoredResume');
  const outputSafety = output.safety || {
    humanReviewRequired: '',
    claimsToVerifyBeforeSending: [],
    evidenceMissing: [],
    suggestedEdits: [],
  };
  const safety: AiSafetySections = {
    humanReviewRequired: HUMAN_REVIEW_REQUIRED,
    claimsToVerifyBeforeSending: uniqueList([
      ...baseSafety.claimsToVerifyBeforeSending,
      ...cleanList(outputSafety.claimsToVerifyBeforeSending),
      ...structured.claimsToVerify,
    ]),
    evidenceMissing: uniqueList([
      ...baseSafety.evidenceMissing,
      ...cleanList(outputSafety.evidenceMissing),
    ]),
    suggestedEdits: uniqueList([
      ...baseSafety.suggestedEdits,
      ...cleanList(outputSafety.suggestedEdits),
    ]),
  };

  return {
    structured,
    markdown: cleanText(output.markdown) || buildTailoredResumeMarkdown(structured),
    safety,
  };
}

export function createTailoredResumeOutputFromStructured(
  structured: TailoredResumeStructured,
  input: AiBaseInput,
): AiTailoredResumeOutput {
  return ensureTailoredResumeOutputSafety(
    {
      structured,
      markdown: buildTailoredResumeMarkdown(structured),
      safety: buildSafetySections(input, 'generateTailoredResume'),
    },
    input,
  );
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

function buildTaskSpecificInstructions<T extends AiTaskType>(taskType: T, input: AiTaskInput<T>): string {
  if (taskType === 'analyzeCvMatch') {
    const deterministicScore = quickScore({
      cvText: cleanText(input.cvText),
      jdText: cleanText(input.jobDescription),
    });
    const matchedSkills = deterministicScore.match.matchedSkills.join(', ') || 'none detected';
    const missingSkills = deterministicScore.match.missingSkills.join(', ') || 'none detected';
    const matchEvidence = Object.entries(deterministicScore.match.evidenceMap)
      .map(
        ([skill, evidence]) =>
          `matchEvidence: ${skill} | CV: "${sanitizePromptText(evidence.cvSpan, 160)}" | JD: "${sanitizePromptText(evidence.jdSpan, 160)}"`,
      )
      .join('\n') || 'matchEvidence: none detected by deterministic pre-screening';

    return [
      'CV match analysis requirements:',
      'Return an AiMatchOutput-compatible result with score, matchedSkills, missingSkills, suggestions, optional atsScore, optional atsIssues, and safety.',
      'Use the deterministic pre-screening results below as the starting point, then verify every item against the full CV and job description.',
      'For each skill you list in matchedSkills, you MUST include a matchEvidence entry showing:',
      '- The exact phrase from the CV that supports this skill claim',
      '- The exact phrase from the job description that requires this skill',
      'Because the current output type has no dedicated matchEvidence field, place matchEvidence entries in suggestions or safety.suggestedEdits.',
      'Use this evidence format exactly: matchEvidence: <skill> | CV: "<exact CV phrase>" | JD: "<exact JD phrase>".',
      'If you cannot find a specific CV phrase to support a skill match, do NOT include that skill in matchedSkills. Move it to missingSkills instead.',
      'Do not inflate the score beyond what the cited CV evidence supports.',
      '',
      'The following skills were detected by automated pre-screening. Verify each one against the CV text:',
      `[DETERMINISTIC_MATCHED_SKILLS]: ${matchedSkills}`,
      '',
      'The following skills appear in the job description but were not found in the CV by automated screening:',
      `[DETERMINISTIC_MISSING_SKILLS]: ${missingSkills}`,
      '',
      `Deterministic quick score: ${deterministicScore.match.score}/100 (${deterministicScore.match.label}).`,
      'Deterministic evidence preview:',
      matchEvidence,
    ].join('\n');
  }

  if (taskType === 'generateCoverLetter') {
    const tone = cleanText((input as { tone?: string }).tone) || 'professional';
    return [
      'Cover letter requirements:',
      'Write a complete, ready-to-send cover letter, not a template, outline, or placeholder.',
      'Include a greeting, 2-3 concise body paragraphs, a closing paragraph, and a sign-off.',
      `Use a ${tone} tone throughout.`,
      'Stay under 400 words before the required review sections.',
      'Reference specific skills or experience from the CV, highlights, user profile, or notes.',
      'Reference specific requirements or context from the job description.',
      'Do not invent experience, credentials, metrics, dates, or company knowledge not present in the inputs.',
      'In Claims to Verify Before Sending, flag any wording that may embellish or overstate the supplied evidence.',
    ].join('\n');
  }

  return '';
}

/** Builds the provider prompt while excluding secrets and raw persistence details. */
export function buildPrompt<T extends AiTaskType>(taskType: T, input: AiTaskInput<T>): string {
  if (taskType === 'generateTailoredResume') {
    return buildTailoredResumePrompt(input);
  }

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
    buildTaskSpecificInstructions(taskType, input),
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
    'You are a professional resume writer. Given the candidate\'s CV and the target job description, produce a tailored resume as JSON.',
    '',
    'Return ONLY valid JSON matching this exact structure:',
    '{',
    '  "summary": "2-3 sentence professional summary tailored to the role",',
    '  "skills": ["skill1", "skill2", "..."],',
    '  "experience": [',
    '    {',
    '      "role": "Job Title",',
    '      "company": "Company Name",',
    '      "location": "City, Country",',
    '      "dates": "Month Year - Month Year",',
    '      "bullets": ["Achievement 1", "Achievement 2"]',
    '    }',
    '  ],',
    '  "education": [',
    '    { "degree": "Degree Name", "institution": "University", "dates": "Year - Year" }',
    '  ],',
    '  "projects_or_additional": ["Item 1", "Item 2"],',
    '  "claimsToVerify": ["Any claim that needs human verification"]',
    '}',
    '',
    'RULES:',
    '- ONLY include experience, skills, and education that appear in the candidate\'s CV.',
    '- Do NOT invent roles, companies, metrics, credentials, or dates.',
    '- Rewrite bullets to emphasize relevance to the target job, but keep them factually grounded.',
    '- claimsToVerify must list anything you rephrased that might misrepresent the original.',
    '- If the CV lacks a section (e.g., no education listed), return an empty array.',
    '- Do not include markdown fences, commentary, or prose outside the JSON object.',
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
export function createStubTailoredResumeOutput(input: AiBaseInput): AiTailoredResumeOutput {
  const jobTitle = cleanText((input as { jobTitle?: string }).jobTitle) || 'the target role';
  const companyName = cleanText((input as { companyName?: string }).companyName) || 'the target company';
  const skills = extractKnownSkills(cleanText(input.cvText));
  const firstSkill = skills[0] || 'Evidence needed: verified skill from the CV';
  const structured = normalizeTailoredResumeStructured({
    summary: `Tailored resume draft for ${jobTitle} at ${companyName}. Use this mock output only after checking every claim against the original CV.`,
    skills: skills.length ? skills : [firstSkill],
    experience: [
      {
        role: 'Evidence needed: verified role from the CV',
        company: 'Evidence needed: verified company from the CV',
        location: 'Evidence needed: verified location from the CV',
        dates: 'Evidence needed: verified dates from the CV',
        bullets: [
          `Emphasize verified ${firstSkill} experience only where it appears in the CV.`,
          `Align wording to ${jobTitle} requirements without adding unsupported metrics.`,
        ],
      },
    ],
    education: [
      {
        degree: 'Evidence needed: verified degree or training from the CV',
        institution: 'Evidence needed: verified institution from the CV',
        dates: 'Evidence needed: verified education dates from the CV',
      },
    ],
    projects_or_additional: [
      'Evidence needed: verified project, certification, or additional qualification from the CV.',
    ],
    claimsToVerify: [
      DEFAULT_TAILORED_RESUME_CLAIM,
      'Replace every Evidence needed placeholder with verified CV facts before exporting.',
    ],
  });

  return createTailoredResumeOutputFromStructured(structured, input);
}

/** Extracts plain text from any typed AI output for hashing and character counts. */
export function outputToText(output: AiTaskOutput): string {
  if ('content' in output) return output.content;
  if ('structured' in output) {
    return [
      output.markdown,
      '',
      'Claims to Verify',
      ...output.structured.claimsToVerify.map((claim) => `- ${claim}`),
      '',
      formatSafetySections(output.safety),
    ].join('\n');
  }

  return [
    `Score: ${output.score}`,
    `Matched: ${output.matchedSkills.join(', ')}`,
    `Missing: ${output.missingSkills.join(', ')}`,
    `Suggestions: ${output.suggestions.join(', ')}`,
    formatSafetySections(output.safety),
  ].join('\n');
}
