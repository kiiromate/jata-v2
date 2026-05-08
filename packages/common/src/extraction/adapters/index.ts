import type { ExtractionAdapter, ExtractionContext, ExtractionResult } from '../types.ts';
import { getMissingFields, getWarnings, classifyConfidence } from '../confidence.ts';
import { greenhouseAdapter } from './greenhouse.ts';
import { leverAdapter } from './lever.ts';
import { ashbyAdapter } from './ashby.ts';
import { workdayAdapter } from './workday.ts';
import { smartRecruitersAdapter } from './smartRecruiters.ts';
import { genericJobPageAdapter } from './genericJobPage.ts';
import { genericOpportunityAdapter } from './genericOpportunity.ts';

// Order matters: specific before generic; genericOpportunity is always last (always matches).
const ADAPTERS: readonly ExtractionAdapter[] = [
  greenhouseAdapter,
  leverAdapter,
  ashbyAdapter,
  workdayAdapter,
  smartRecruitersAdapter,
  genericJobPageAdapter,
  genericOpportunityAdapter,
];

export function detectAdapter(url: string): ExtractionAdapter {
  for (const adapter of ADAPTERS) {
    if (adapter.detect(url)) return adapter;
  }
  return genericOpportunityAdapter;
}

export function buildExtractionResult(context: ExtractionContext): ExtractionResult {
  const adapter = detectAdapter(context.url);
  const normalized = adapter.normalize(context);

  const partial: Partial<ExtractionResult> = {
    title: normalized.title ?? context.title ?? null,
    company: normalized.company ?? context.company ?? null,
    location: normalized.location ?? context.location ?? null,
    description: normalized.description ?? context.description ?? null,
    requirements: normalized.requirements ?? [],
    responsibilities: normalized.responsibilities ?? [],
    employmentType: normalized.employmentType ?? null,
    deadline: normalized.deadline ?? null,
    applyUrl: normalized.applyUrl ?? context.applyUrl ?? null,
    sourceUrl: context.url,
    sourceHost: safeHostname(context.url),
    sourceType: adapter.id,
    extractionMethod: normalized.extractionMethod ?? 'dom',
    adapterId: adapter.id,
    rawSignals: normalized.rawSignals,
  };

  const confidenceScore = adapter.confidence(partial);
  const missingFields = getMissingFields(partial);
  const warnings = getWarnings(partial);
  const label = classifyConfidence(confidenceScore);

  return {
    title: partial.title ?? null,
    company: partial.company ?? null,
    location: partial.location ?? null,
    description: partial.description ?? null,
    requirements: partial.requirements ?? [],
    responsibilities: partial.responsibilities ?? [],
    employmentType: partial.employmentType ?? null,
    deadline: partial.deadline ?? null,
    applyUrl: partial.applyUrl ?? null,
    sourceUrl: context.url,
    sourceHost: partial.sourceHost ?? '',
    sourceType: partial.sourceType ?? 'unknown',
    extractionMethod: partial.extractionMethod ?? 'dom',
    adapterId: partial.adapterId ?? 'generic_opportunity',
    confidenceScore,
    missingFields,
    warnings,
    requiresReview: label !== 'strong',
    rawSignals: partial.rawSignals,
  };
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

export { ADAPTERS };
