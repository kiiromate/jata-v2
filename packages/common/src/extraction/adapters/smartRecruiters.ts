import type { ExtractionAdapter, ExtractionContext, ExtractionResult } from '../types.ts';
import { scoreConfidence } from '../confidence.ts';

export const smartRecruitersAdapter: ExtractionAdapter = {
  id: 'smart_recruiters',
  label: 'SmartRecruiters',
  detect(url: string): boolean {
    return /smartrecruiters\.com/i.test(url);
  },
  normalize(context: ExtractionContext): Partial<ExtractionResult> {
    return {
      title: context.title ?? null,
      company: context.company ?? null,
      description: context.description ?? null,
      location: context.location ?? null,
      applyUrl: context.applyUrl ?? context.url,
      extractionMethod: context.jsonLd ? 'smart_recruiters_adapter+json-ld' : 'smart_recruiters_adapter',
      rawSignals: context.jsonLd ? { jsonLd: context.jsonLd } : undefined,
    };
  },
  confidence(result: Partial<ExtractionResult>): number {
    return scoreConfidence(result);
  },
};
