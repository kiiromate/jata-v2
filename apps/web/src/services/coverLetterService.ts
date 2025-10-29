/**
 * Cover Letter Generation Service
 *
 * Generates professional, human-quality cover letters using Hugging Face.
 * Follows zero-budget constraint with intelligent fallbacks.
 */

import { callHuggingFace, MODELS } from '@/lib/huggingfaceService';

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
}

/**
 * Generates a professional cover letter using AI
 */
export async function generateCoverLetter(
  params: CoverLetterParams
): Promise<CoverLetterResult> {
  try {
    const prompt = buildCoverLetterPrompt(params);

    const response = await callHuggingFace(
      MODELS.TEXT_GEN_SMALL,
      prompt,
      {
        max_new_tokens: 500,
        temperature: 0.7,
        return_full_text: false,
      }
    );

    const generatedText = response[0]?.generated_text || '';

    if (!generatedText) {
      // Fallback to template-based generation
      return generateTemplateBasedCoverLetter(params);
    }

    // Parse the generated text into structured sections
    const parsed = parseCoverLetterText(generatedText, params);

    return {
      ...parsed,
      success: true,
    };
  } catch (error) {
    console.error('Cover letter generation error:', error);
    // Fallback to template-based generation
    return generateTemplateBasedCoverLetter(params);
  }
}

/**
 * Builds an effective prompt for cover letter generation
 */
function buildCoverLetterPrompt(params: CoverLetterParams): string {
  const { jobTitle, companyName, highlights, tone, jobDescription } = params;

  const toneInstructions = {
    professional: 'Write in a professional, confident tone.',
    conversational: 'Write in a warm, conversational yet professional tone.',
    formal: 'Write in a formal, traditional business tone.',
  };

  const highlightsText = highlights.slice(0, 3).join('; ');
  const jobDescSnippet = jobDescription
    ? jobDescription.substring(0, 200)
    : 'This is a role in my field of expertise.';

  return `Write a concise, professional cover letter for a ${jobTitle} position at ${companyName}.

${toneInstructions[tone]}

Key qualifications to mention:
${highlightsText}

Job context: ${jobDescSnippet}

Requirements:
- 3 paragraphs maximum
- First paragraph: Why I'm interested in this specific role and company
- Second paragraph: My relevant experience and achievements
- Third paragraph: My enthusiasm and call to action
- Use short, direct sentences
- Avoid buzzwords like "passionate", "synergy", "leverage"
- Sound human, not AI-generated
- No clichés

Cover letter:`;
}

/**
 * Parses generated text into structured sections
 */
function parseCoverLetterText(
  text: string,
  params: CoverLetterParams
): Omit<CoverLetterResult, 'success'> {
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
  const { jobTitle, companyName, highlights, userName, tone } = params;

  // Opening paragraph - why this role/company
  const opening = params.customOpening || generateOpeningParagraph(jobTitle, companyName, tone);

  // Body paragraphs - experience and achievements
  const body = [
    generateBodyParagraph(highlights, tone),
  ];

  // Closing paragraph - enthusiasm and CTA
  const closing = params.customClosing || generateClosingParagraph(jobTitle, tone);

  const content = [opening, ...body, closing].join('\n\n');

  return {
    content,
    opening,
    body,
    closing,
    success: true,
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
