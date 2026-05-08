import type { ExtractionResult } from './types.ts';

const DESCRIPTION_MIN_CHARS = 200;

// Weights must sum to 1.0
const WEIGHTS = {
  title: 0.25,
  company: 0.20,
  sourceUrl: 0.13,
  description: 0.15,
  applyUrl: 0.08,
  location: 0.07,
  structured: 0.05,
  deadline: 0.02,
  adapterMatch: 0.03,
  jsonLdPresent: 0.02,
} as const;

export type ConfidenceLabel = 'strong' | 'review_recommended' | 'weak';

export function scoreConfidence(result: Partial<ExtractionResult>): number {
  let score = 0;

  if (result.title?.trim()) score += WEIGHTS.title;
  if (result.company?.trim()) score += WEIGHTS.company;
  if (result.sourceUrl?.trim()) score += WEIGHTS.sourceUrl;

  const descLen = result.description?.trim().length ?? 0;
  if (descLen >= DESCRIPTION_MIN_CHARS) {
    score += WEIGHTS.description;
  } else if (descLen > 0) {
    score += WEIGHTS.description * (descLen / DESCRIPTION_MIN_CHARS);
  }

  if (result.applyUrl?.trim()) score += WEIGHTS.applyUrl;
  if (result.location?.trim()) score += WEIGHTS.location;

  if ((result.requirements?.length ?? 0) > 0 || (result.responsibilities?.length ?? 0) > 0) {
    score += WEIGHTS.structured;
  }

  if (result.deadline?.trim()) score += WEIGHTS.deadline;

  if (result.adapterId && result.adapterId !== 'generic_opportunity') {
    score += WEIGHTS.adapterMatch;
  }

  if (result.rawSignals?.jsonLd) score += WEIGHTS.jsonLdPresent;

  // Suspicious value penalties
  if (result.title && result.title.trim().length < 3) score -= 0.08;
  if (result.company && result.company.trim().length < 2) score -= 0.05;

  return Math.max(0, Math.min(1, score));
}

export function classifyConfidence(score: number): ConfidenceLabel {
  if (score >= 0.80) return 'strong';
  if (score >= 0.55) return 'review_recommended';
  return 'weak';
}

export function getMissingFields(result: Partial<ExtractionResult>): string[] {
  const missing: string[] = [];
  if (!result.title?.trim()) missing.push('title');
  if (!result.company?.trim()) missing.push('company');
  if (!result.description?.trim()) missing.push('description');
  if (!result.location?.trim()) missing.push('location');
  if (!result.applyUrl?.trim()) missing.push('applyUrl');
  return missing;
}

export function getWarnings(result: Partial<ExtractionResult>): string[] {
  const warnings: string[] = [];
  const descLen = result.description?.trim().length ?? 0;
  if (descLen > 0 && descLen < DESCRIPTION_MIN_CHARS) {
    warnings.push('Short description — may be incomplete');
  }
  if (result.title && result.title.trim().length < 5) {
    warnings.push('Very short title — verify accuracy');
  }
  if (!result.company?.trim() && result.adapterId === 'generic_opportunity') {
    warnings.push('Company not detected — check manually');
  }
  return warnings;
}
