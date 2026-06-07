/**
 * Cover Letter Generation Service
 *
 * Generates professional cover letters through the server-side AI router.
 * Keeps provider secrets out of the browser and falls back locally.
 */

import {
  appendSafetySections,
  createFallbackSafety,
  invokeAiTask,
  type AiOutputMetadata,
  type AiSafetySections,
  type AiTextOutput,
} from './aiGateway';

export interface CoverLetterParams {
  // Job details
  jobTitle: string;
  companyName: string;
  jobDescription?: string;

  // User details
  userName: string;
  userEmail?: string;
  userPhone?: string;

  // Resume highlights (3-5 key achievements or skills)
  highlights: string[];

  // Tone preference
  tone: 'professional' | 'conversational' | 'formal';

  // Optional customization
  customOpening?: string;
  customClosing?: string;
}

export interface CoverLetterResult {
  content: string;
  opening: string;
  body: string[];
  closing: string;
  success: boolean;
  error?: string;
  metadata?: AiOutputMetadata;
  safety?: AiSafetySections;
}

/**
 * Generates a professional cover letter through the AI Edge Function.
 */
export async function generateCoverLetter(
  params: CoverLetterParams
): Promise<CoverLetterResult> {
  try {
    const payload = await invokeAiTask<AiTextOutput>('generateCoverLetter', {
      jobTitle: params.jobTitle,
      companyName: params.companyName,
      jobDescription: params.jobDescription || '',
      userName: params.userName,
      userProfile: [params.userEmail, params.userPhone].filter(Boolean).join(' '),
      highlights: params.highlights,
      tone: params.tone,
      notes: [params.customOpening, params.customClosing].filter(Boolean).join('\n'),
    });
    const parsed = parseCoverLetterText(payload.output.content);

    return {
      ...parsed,
      success: true,
      metadata: payload.metadata,
      safety: payload.output.safety,
    };
  } catch (error) {
    console.error('Cover letter generation error:', error instanceof Error ? error.message : 'Unknown error.');
    return generateTemplateBasedCoverLetter(params);
  }
}

/**
 * Parses generated text into structured sections
 */
function parseCoverLetterText(text: string): Omit<CoverLetterResult, 'success'> {
  // Clean up the text
  const cleaned = text.trim();

  // Split into paragraphs
  const paragraphs = cleaned
    .split('\n\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (paragraphs.length >= 3) {
    return {
      content: cleaned,
      opening: paragraphs[0],
      body: paragraphs.slice(1, -1),
      closing: paragraphs[paragraphs.length - 1],
    };
  }

  // If parsing fails, return as-is with fallback structure
  return {
    content: cleaned,
    opening: paragraphs[0] || '',
    body: paragraphs.slice(1) || [],
    closing: 'Thank you for your consideration. I look forward to discussing this opportunity further.',
  };
}

/**
 * Template-based fallback when AI generation fails
 */
function generateTemplateBasedCoverLetter(
  params: CoverLetterParams
): CoverLetterResult {
  const { jobTitle, companyName, highlights, tone } = params;

  // Opening paragraph - why this role/company
  const opening = params.customOpening || generateOpeningParagraph(jobTitle, companyName, tone);

  // Body paragraphs - experience and achievements
  const body = [
    generateBodyParagraph(highlights, tone),
  ];

  // Closing paragraph - enthusiasm and CTA
  const closing = params.customClosing || generateClosingParagraph(jobTitle, tone);

  const safety = createFallbackSafety([
    highlights.length > 0
      ? 'Evidence needed: verify each highlight before sending.'
      : 'Evidence needed: at least one verified CV highlight.',
  ]);
  const content = appendSafetySections([opening, ...body, closing].join('\n\n'), safety);

  return {
    content,
    opening,
    body,
    closing,
    success: true,
    metadata: {
      provider: 'mock',
      model: 'local-fallback',
      generatedAt: new Date().toISOString(),
      cached: false,
    },
    safety,
  };
}

function generateOpeningParagraph(
  jobTitle: string,
  companyName: string,
  tone: string
): string {
  if (tone === 'conversational') {
    return `I'm writing to apply for the ${jobTitle} position at ${companyName}. The role aligns closely with my background, and I'm excited about the opportunity to contribute to your team.`;
  }

  if (tone === 'formal') {
    return `I am writing to express my interest in the ${jobTitle} position at ${companyName}. My background and experience align well with the requirements outlined for this role.`;
  }

  // Professional (default)
  return `I'm applying for the ${jobTitle} role at ${companyName}. The position matches my experience and career goals, and I believe I can make a strong contribution to your team.`;
}

function generateBodyParagraph(highlights: string[], tone: string): string {
  if (highlights.length === 0) {
    return 'I bring relevant experience and a track record of delivering results in similar roles.';
  }

  const intro =
    tone === 'formal'
      ? 'My experience includes:'
      : 'Here is what I bring to this role:';

  const highlightsList = highlights
    .slice(0, 3)
    .map((h) => `${h.trim()}`)
    .join('. ');

  return `${intro} ${highlightsList}.`;
}

function generateClosingParagraph(jobTitle: string, tone: string): string {
  if (tone === 'conversational') {
    return `I'd love to discuss how my experience aligns with this ${jobTitle} role. Thank you for considering my application.`;
  }

  if (tone === 'formal') {
    return `I would welcome the opportunity to discuss how my qualifications align with your needs for this ${jobTitle} position. Thank you for your time and consideration.`;
  }

  // Professional (default)
  return `I'd appreciate the opportunity to discuss this ${jobTitle} role further. Thank you for your consideration.`;
}

/**
 * Formats the cover letter for export with proper header
 */
export function formatCoverLetterForExport(
  letter: CoverLetterResult,
  params: CoverLetterParams,
  date: Date = new Date()
): string {
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const header = [
    params.userName,
    params.userEmail || '',
    params.userPhone || '',
    '',
    formattedDate,
    '',
    `Hiring Manager`,
    params.companyName,
    '',
  ]
    .filter(Boolean)
    .join('\n');

  const greeting = `Dear Hiring Manager,\n`;
  const body = letter.content;
  const signature = `\n\nSincerely,\n${params.userName}`;

  return `${header}\n${greeting}\n${body}${signature}`;
}
