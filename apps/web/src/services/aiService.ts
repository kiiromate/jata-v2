import {
  appendSafetySections,
  createFallbackSafety,
  invokeAiTask,
  type AiMatchOutput,
  type AiOutputMetadata,
  type AiSafetySections,
} from './aiGateway';

/**
 * Generates professional resume bullet points using the STAR method based on an accomplishment description and keywords.
 *
 * @param description The accomplishment description provided by the user.
 * @param keywords An array of keywords to incorporate into the bullet points.
 * @returns A promise that resolves to an array of 3 generated bullet point strings.
 * @throws Will throw an error if the API call fails or the API key is missing.
 */
export async function generateBulletPoint(description: string, keywords: string[]): Promise<string[]> {
  const cleaned = description.trim();
  const keywordText = keywords.slice(0, 3).join(', ');
  const safety = createFallbackSafety(['Evidence needed: measurable result for this accomplishment.']);

  if (!cleaned) {
    return [appendSafetySections('Evidence needed: accomplishment details.', safety)];
  }

  return [
    appendSafetySections(`Improved ${cleaned}${keywordText ? ` with ${keywordText}` : ''}.`, safety),
    `Evidence needed: add a verified metric for this accomplishment.`,
    `Suggested edit: replace generic wording with a specific result from your CV.`,
  ];
}

// --- Resume and Job Description Analysis ---

export interface AnalysisResult {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  suggestions?: string[];
  atsScore?: number;
  atsIssues?: string[];
  safety?: AiSafetySections;
  metadata?: AiOutputMetadata;
}

// A simplified list of skills for demonstration. In a real app, this would be more extensive.
const SKILL_PATTERNS: { [key: string]: RegExp } = {
  JavaScript: /javascript|js/gi,
  TypeScript: /typescript|ts/gi,
  React: /react/gi,
  NodeJS: /node\.js|nodejs/gi,
  Python: /python/gi,
  SQL: /sql/gi,
  PostgreSQL: /postgresql/gi,
  Docker: /docker/gi,
  Kubernetes: /kubernetes|k8s/gi,
  AWS: /aws|amazon web services/gi,
  GCP: /gcp|google cloud platform/gi,
  Azure: /azure/gi,
  HTML: /html/gi,
  CSS: /css|tailwind/gi,
  "Project Management": /project management|agile|scrum/gi,
  "CI/CD": /ci\/cd|jenkins|gitlab ci/gi,
};

/**
 * Extracts skills from a given text based on predefined regex patterns.
 * @param text The text to analyze (resume or job description).
 * @returns A Set of unique skills found in the text.
 */
const extractSkills = (text: string): Set<string> => {
  const foundSkills = new Set<string>();
  if (!text) return foundSkills;

  for (const skill in SKILL_PATTERNS) {
    SKILL_PATTERNS[skill].lastIndex = 0;
    if (SKILL_PATTERNS[skill].test(text)) {
      foundSkills.add(skill);
    }
  }
  return foundSkills;
};

/**
 * Extracts job keywords locally for no-key operation.
 */
export async function extractKeywordsFromJobDescription(jobDescription: string): Promise<string[]> {
  return [...extractSkills(jobDescription)];
}

/**
 * Optimizes a bullet point locally without adding unsupported metrics.
 */
export async function optimizeBulletPoint(bulletPoint: string, jobKeywords: string[]): Promise<string> {
  const cleaned = bulletPoint.trim();
  const keywordText = jobKeywords.slice(0, 2).join(', ');
  if (!cleaned) return 'Evidence needed: original bullet point.';
  if (/^(Developed|Implemented|Led|Built|Improved)/i.test(cleaned)) return cleaned;
  return `Improved ${cleaned}${keywordText ? ` with ${keywordText}` : ''}`;
}

/**
 * Classifies industry with deterministic keyword checks.
 */
export async function classifyIndustry(jobTitle: string, jobDescription: string): Promise<string> {
  const text = `${jobTitle} ${jobDescription}`.toLowerCase();
  if (/software|developer|engineer|react|typescript|api/.test(text)) return 'Technology';
  if (/finance|bank|investment|accounting/.test(text)) return 'Finance';
  if (/health|medical|clinic|hospital/.test(text)) return 'Healthcare';
  if (/teacher|education|school|training/.test(text)) return 'Education';
  if (/marketing|brand|campaign|content/.test(text)) return 'Marketing';
  return 'Other';
}

/**
 * Calculates ATS compatibility using local checks.
 */
export function calculateATSScore(resumeText: string): {
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  let score = 100;

  if (!/@/.test(resumeText)) {
    issues.push('Missing email address');
    score -= 15;
  }

  if (!/\d{3}[-.]?\d{3}[-.]?\d{4}/.test(resumeText)) {
    issues.push('Missing phone number');
    score -= 10;
  }

  for (const section of ['experience', 'education', 'skills']) {
    if (!new RegExp(section, 'i').test(resumeText)) {
      issues.push(`Missing "${section}" section`);
      score -= 10;
    }
  }

  if (!/\d+%|\d+x|increased|decreased|reduced/i.test(resumeText)) {
    issues.push('Add quantifiable achievements only when verified');
    score -= 10;
  }

  return { score: Math.max(0, score), issues };
}

/**
 * Analyzes job focus locally without direct browser model calls.
 */
export async function analyzeWithZeroShot(jobDescription: string): Promise<string[]> {
  const labels = [
    'frontend development',
    'backend development',
    'project management',
    'data analysis',
    'devops',
    'ui/ux design',
  ];
  const text = jobDescription.toLowerCase();
  return labels
    .map((label) => ({
      label,
      score: label.split(' ').filter((part) => text.includes(part)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.label);
}

/**
 * Analyzes a resume against a job description to find matching and missing skills.
 * Uses AI when available, falls back to regex patterns.
 *
 * @param resumeText The text of the user's resume.
 * @param jobDescriptionText The text of the job description.
 * @returns An object containing the match score, matched skills, and missing skills.
 */
export const analyzeResumeAgainstJobDescription = async (
  resumeText: string,
  jobDescriptionText: string
): Promise<AnalysisResult> => {
  try {
    const payload = await invokeAiTask<AiMatchOutput>('analyzeCvMatch', {
      cvText: resumeText,
      jobDescription: jobDescriptionText,
    });

    return {
      ...payload.output,
      metadata: payload.metadata,
    };
  } catch (error) {
    console.warn('AI analysis failed, using local fallback:', error instanceof Error ? error.message : 'Unknown error.');
    const resumeSkills = extractSkills(resumeText);
    const jobSkills = extractSkills(jobDescriptionText);
    const safety = createFallbackSafety([
      'Evidence needed: confirm missing skills against the job description.',
    ]);

    if (jobSkills.size === 0) {
      return {
        score: 0,
        matchedSkills: [],
        missingSkills: [],
        safety,
        metadata: {
          provider: 'mock',
          model: 'local-fallback',
          generatedAt: new Date().toISOString(),
          cached: false,
        },
      };
    }

    const matchedSkills = [...jobSkills].filter(skill => resumeSkills.has(skill));
    const missingSkills = [...jobSkills].filter(skill => !resumeSkills.has(skill));

    const score = Math.round((matchedSkills.length / jobSkills.size) * 100);

    return {
      score,
      matchedSkills,
      missingSkills,
      suggestions: missingSkills.map((skill) => `Add ${skill} only if you have direct evidence for it.`),
      atsScore: calculateATSScore(resumeText).score,
      atsIssues: calculateATSScore(resumeText).issues,
      safety,
      metadata: {
        provider: 'mock',
        model: 'local-fallback',
        generatedAt: new Date().toISOString(),
        cached: false,
      },
    };
  }
};
