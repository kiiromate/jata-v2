import type { ExtractionAdapter, ExtractionContext, ExtractionResult } from '../types.ts';
import { scoreConfidence } from '../confidence.ts';

export const workdayAdapter: ExtractionAdapter = {
  id: 'workday',
  label: 'Workday',
  detect(url: string): boolean {
    return /myworkdayjobs\.com/i.test(url);
  },
  normalize(context: ExtractionContext): Partial<ExtractionResult> {
    return {
      title: context.title ?? null,
      company: context.company ?? null,
      description: context.description ?? null,
      location: context.location ?? null,
      applyUrl: context.applyUrl ?? context.url,
      extractionMethod: context.jsonLd ? 'workday_adapter+json-ld' : 'workday_adapter',
      rawSignals: context.jsonLd ? { jsonLd: context.jsonLd } : undefined,
    };
  },
  confidence(result: Partial<ExtractionResult>): number {
    return scoreConfidence(result);
  },
};
