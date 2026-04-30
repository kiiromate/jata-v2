/**
 * Compatibility exports for older imports.
 *
 * Direct browser calls to Hugging Face were removed so provider API keys stay
 * on the Supabase Edge Function side. New AI features should call
 * `ai-generate` through the web AI services.
 */

import {
  calculateATSScore,
  classifyIndustry,
  extractKeywordsFromJobDescription,
  optimizeBulletPoint,
} from '@/services/aiService';

export const MODELS = {
  TEXT_GEN: 'server-routed',
  TEXT_GEN_SMALL: 'server-routed',
  CLASSIFIER: 'server-routed',
  FEATURE_EXTRACTION: 'local-deterministic',
};

/** Blocks direct client-side provider calls. */
export async function callHuggingFace(): Promise<never> {
  throw new Error('Direct client-side Hugging Face calls are disabled. Use the ai-generate Edge Function.');
}

export {
  calculateATSScore,
  classifyIndustry,
  extractKeywordsFromJobDescription,
  optimizeBulletPoint,
};

/** Calculates a local match score for compatibility callers. */
export async function calculateMatchScore(
  resumeText: string,
  jobDescription: string,
): Promise<{
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
}> {
  const jobKeywords = await extractKeywordsFromJobDescription(jobDescription);
  const resumeLower = resumeText.toLowerCase();
  const matchedKeywords = jobKeywords.filter((keyword) => resumeLower.includes(keyword.toLowerCase()));
  const missingKeywords = jobKeywords.filter((keyword) => !resumeLower.includes(keyword.toLowerCase()));

  return {
    score: jobKeywords.length > 0 ? Math.round((matchedKeywords.length / jobKeywords.length) * 100) : 0,
    matchedKeywords,
    missingKeywords,
  };
}

/** Generates local resume suggestions for compatibility callers. */
export async function generateResumeSuggestions(
  resumeText: string,
  jobDescription: string,
): Promise<string[]> {
  const { missingKeywords, score } = await calculateMatchScore(resumeText, jobDescription);
  const suggestions: string[] = [];

  if (score < 50) {
    suggestions.push(`Your resume matches ${score}% of detected job keywords. Review the job evidence before editing.`);
  }

  if (missingKeywords.length > 0) {
    suggestions.push(`Consider these keywords only with proof: ${missingKeywords.slice(0, 5).join(', ')}`);
  }

  if (!/\d/.test(resumeText)) {
    suggestions.push('Evidence needed: verified metrics before adding numeric claims.');
  }

  return suggestions;
}
