import type { ExtractionAdapter, ExtractionContext, ExtractionResult } from '../types.ts';
import { scoreConfidence } from '../confidence.ts';

export const ashbyAdapter: ExtractionAdapter = {
  id: 'ashby',
  label: 'Ashby',
  detect(url: string): boolean {
    return /ashbyhq\.com|jobs\.ashby\.io/i.test(url);
  },
  normalize(context: ExtractionContext): Partial<ExtractionResult> {
    return {
      title: context.title ?? null,
      company: context.company ?? null,
      description: context.description ?? null,
      location: context.location ?? null,
      applyUrl: context.applyUrl ?? context.url,
      extractionMethod: context.jsonLd ? 'ashby_adapter+json-ld' : 'ashby_adapter',
      rawSignals: context.jsonLd ? { jsonLd: context.jsonLd } : undefined,
    };
  },
  confidence(result: Partial<ExtractionResult>): number {
    return scoreConfidence(result);
  },
};
