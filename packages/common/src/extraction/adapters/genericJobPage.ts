import type { ExtractionAdapter, ExtractionContext, ExtractionResult } from '../types.ts';
import { scoreConfidence } from '../confidence.ts';

const JOB_URL_PATTERN = /\/jobs?\/|\/careers?\/|\/positions?\//i;
const KNOWN_JOB_BOARD = /linkedin\.com\/jobs|indeed\.com|glassdoor\.com|ziprecruiter\.com|wellfound\.com/i;

export const genericJobPageAdapter: ExtractionAdapter = {
  id: 'generic_job_page',
  label: 'Job Page',
  detect(url: string): boolean {
    return JOB_URL_PATTERN.test(url) || KNOWN_JOB_BOARD.test(url);
  },
  normalize(context: ExtractionContext): Partial<ExtractionResult> {
    return {
      title: context.title ?? null,
      company: context.company ?? null,
      description: context.description ?? null,
      location: context.location ?? null,
      applyUrl: context.applyUrl ?? context.url,
      extractionMethod: context.jsonLd ? 'generic_job_page+json-ld' : 'generic_job_page+dom',
      rawSignals: context.jsonLd ? { jsonLd: context.jsonLd } : undefined,
    };
  },
  confidence(result: Partial<ExtractionResult>): number {
    // Generic pages are slightly penalised vs specific adapters
    return Math.max(0, scoreConfidence(result) - 0.03);
  },
};
