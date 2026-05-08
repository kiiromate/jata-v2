import type { ExtractionAdapter, ExtractionContext, ExtractionResult } from '../types.ts';
import { scoreConfidence } from '../confidence.ts';

// Final fallback: grants, fellowships, scholarships, and non-standard pages.
export const genericOpportunityAdapter: ExtractionAdapter = {
  id: 'generic_opportunity',
  label: 'Opportunity',
  // Always matches — must be last in the registry
  detect(_url: string): boolean {
    return true;
  },
  normalize(context: ExtractionContext): Partial<ExtractionResult> {
    return {
      title: context.title ?? null,
      company: context.company ?? null,
      description: context.description ?? null,
      location: context.location ?? null,
      applyUrl: context.applyUrl ?? context.url ?? null,
      extractionMethod: context.jsonLd ? 'generic_opportunity+json-ld' : 'generic_opportunity+dom',
      rawSignals: context.jsonLd ? { jsonLd: context.jsonLd } : undefined,
    };
  },
  confidence(result: Partial<ExtractionResult>): number {
    // Generic fallback has a lower confidence ceiling
    return Math.max(0, scoreConfidence(result) - 0.05);
  },
};
