import type { ExtractionAdapter, ExtractionContext, ExtractionResult } from '../types.ts';
import { scoreConfidence } from '../confidence.ts';

function companyFromUrl(url: string): string | null {
  try {
    const match = url.match(/lever\.co\/([^/?#]+)/i);
    if (match?.[1]) return match[1].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  } catch { /* ignore */ }
  return null;
}

export const leverAdapter: ExtractionAdapter = {
  id: 'lever',
  label: 'Lever',
  detect(url: string): boolean {
    return /lever\.co/i.test(url);
  },
  normalize(context: ExtractionContext): Partial<ExtractionResult> {
    return {
      title: context.title ?? null,
      company: context.company ?? companyFromUrl(context.url) ?? null,
      description: context.description ?? null,
      location: context.location ?? null,
      applyUrl: context.applyUrl ?? context.url,
      extractionMethod: context.jsonLd ? 'lever_adapter+json-ld' : 'lever_adapter',
      rawSignals: context.jsonLd ? { jsonLd: context.jsonLd } : undefined,
    };
  },
  confidence(result: Partial<ExtractionResult>): number {
    return scoreConfidence(result);
  },
};
