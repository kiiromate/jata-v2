// Self-contained capture confidence scorer for the browser extension.
// No @jata/common import — kept standalone so the extension bundle stays lean
// and independent of the common package build pipeline.

export interface CaptureConfidenceInput {
  title?: string | null;
  company?: string | null;
  jobUrl?: string | null;
  description?: string | null;
  source?: string | null;
}

export interface CaptureConfidenceResult {
  confidenceScore: number;
  confidenceLabel: 'strong' | 'review_recommended' | 'weak';
  missingFields: string[];
  warnings: string[];
  requiresReview: boolean;
  adapterId: string;
  extractionMethod: string;
}

const DESCRIPTION_MIN_CHARS = 200;

const KNOWN_BOARDS: Array<{ id: string; pattern: RegExp }> = [
  { id: 'greenhouse', pattern: /greenhouse\.io|boards\.greenhouse\.io/i },
  { id: 'lever', pattern: /lever\.co/i },
  { id: 'ashby', pattern: /ashbyhq\.com|jobs\.ashby\.io/i },
  { id: 'workday', pattern: /myworkdayjobs\.com/i },
  { id: 'smart_recruiters', pattern: /smartrecruiters\.com/i },
  { id: 'linkedin', pattern: /linkedin\.com\/jobs/i },
  { id: 'indeed', pattern: /indeed\.com/i },
  { id: 'wellfound', pattern: /wellfound\.com/i },
  { id: 'ziprecruiter', pattern: /ziprecruiter\.com/i },
];

function resolveAdapterId(url: string, source?: string | null): string {
  if (source) {
    const slug = source.toLowerCase().replace(/\s+/g, '_');
    // Map known source labels to canonical adapter ids
    const aliases: Record<string, string> = {
      linkedin: 'linkedin',
      indeed: 'indeed',
      greenhouse: 'greenhouse',
      lever: 'lever',
      ashby: 'ashby',
      workday: 'workday',
      smartrecruiters: 'smart_recruiters',
      wellfound: 'wellfound',
      ziprecruiter: 'ziprecruiter',
    };
    if (aliases[slug]) return aliases[slug];
  }
  for (const board of KNOWN_BOARDS) {
    if (board.pattern.test(url)) return board.id;
  }
  if (/\/jobs?\/|\/careers?\/|\/positions?\//i.test(url)) return 'generic_job_page';
  return 'generic_opportunity';
}

export function computeCaptureConfidence(input: CaptureConfidenceInput): CaptureConfidenceResult {
  const { title, company, jobUrl, description, source } = input;
  const url = jobUrl?.trim() ?? '';
  const adapterId = resolveAdapterId(url, source);
  const isKnownBoard = adapterId !== 'generic_opportunity' && adapterId !== 'generic_job_page';

  let score = 0;

  if (title?.trim()) score += 0.25;
  if (company?.trim()) score += 0.20;

  // sourceUrl + applyUrl combined (for extension captures the job URL serves as both)
  if (url) score += 0.21;

  const descLen = description?.trim().length ?? 0;
  if (descLen >= DESCRIPTION_MIN_CHARS) {
    score += 0.15;
  } else if (descLen > 0) {
    score += 0.15 * (descLen / DESCRIPTION_MIN_CHARS);
  }

  if (isKnownBoard) score += 0.03;

  // Suspicious value penalties
  if (title && title.trim().length < 3) score -= 0.08;
  if (company && company.trim().length < 2) score -= 0.05;

  score = Math.max(0, Math.min(1, Math.round(score * 100) / 100));

  const missingFields: string[] = [];
  if (!title?.trim()) missingFields.push('title');
  if (!company?.trim()) missingFields.push('company');
  if (!description?.trim()) missingFields.push('description');
  if (!url) missingFields.push('sourceUrl');

  const warnings: string[] = [];
  if (descLen > 0 && descLen < DESCRIPTION_MIN_CHARS) {
    warnings.push('Short description — may be incomplete');
  }
  if (title && title.trim().length < 5) {
    warnings.push('Very short title — verify accuracy');
  }

  const confidenceLabel: CaptureConfidenceResult['confidenceLabel'] =
    score >= 0.80 ? 'strong' : score >= 0.55 ? 'review_recommended' : 'weak';

  return {
    confidenceScore: score,
    confidenceLabel,
    missingFields,
    warnings,
    requiresReview: confidenceLabel !== 'strong',
    adapterId,
    extractionMethod: 'extension_dom',
  };
}
