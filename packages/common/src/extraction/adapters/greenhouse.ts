import type { ExtractionAdapter, ExtractionContext, ExtractionResult } from '../types.ts';
import { scoreConfidence } from '../confidence.ts';

function companyFromUrl(url: string): string | null {
  try {
    const { hostname, pathname } = new URL(url);
    if (hostname === 'boards.greenhouse.io' || hostname === 'job-boards.greenhouse.io') {
      const slug = pathname.split('/').filter(Boolean)[0];
      if (slug) return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }
  } catch { /* ignore */ }
  return null;
}

export const greenhouseAdapter: ExtractionAdapter = {
  id: 'greenhouse',
  label: 'Greenhouse',
  detect(url: string): boolean {
    return /greenhouse\.io|boards\.greenhouse\.io|job-boards\.greenhouse\.io/i.test(url);
  },
  normalize(context: ExtractionContext): Partial<ExtractionResult> {
    return {
      title: context.title ?? null,
      company: context.company ?? companyFromUrl(context.url) ?? null,
      description: context.description ?? null,
      location: context.location ?? null,
      applyUrl: context.applyUrl ?? context.url,
      extractionMethod: context.jsonLd ? 'greenhouse_adapter+json-ld' : 'greenhouse_adapter',
      rawSignals: context.jsonLd ? { jsonLd: context.jsonLd } : undefined,
    };
  },
  confidence(result: Partial<ExtractionResult>): number {
    return scoreConfidence(result);
  },
};
