import type {
  CaptureMethod,
  CaptureMetadata,
  CaptureSource,
  CreateCaptureInput,
} from './captureInbox';

export interface SharedOpportunityInput {
  title?: string | null;
  text?: string | null;
  url?: string | null;
}

export interface ParsedSharedOpportunity {
  roleTitle: string;
  sourceUrl: string;
  rawText: string;
  method: CaptureMethod;
  metadata: CaptureMetadata;
}

const URL_PATTERN = /https?:\/\/[^\s<>"')\]]+/i;

function clean(value: string | null | undefined): string {
  return value?.trim() || '';
}

function trimTrailingUrlPunctuation(value: string): string {
  return value.replace(/[.,;:!?]+$/, '');
}

export function extractFirstUrl(value: string | null | undefined): string {
  const match = clean(value).match(URL_PATTERN);
  return match ? trimTrailingUrlPunctuation(match[0]) : '';
}

function firstUsefulLine(value: string): string {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !URL_PATTERN.test(line)) || '';
}

export function parseSharedOpportunity(input: SharedOpportunityInput): ParsedSharedOpportunity {
  const title = clean(input.title);
  const text = clean(input.text);
  const explicitUrl = clean(input.url);
  const sourceUrl = explicitUrl || extractFirstUrl(text);
  const roleTitle = title || firstUsefulLine(text);

  return {
    roleTitle,
    sourceUrl,
    rawText: text || title || sourceUrl,
    method: explicitUrl ? 'share' : sourceUrl ? 'url' : 'share',
    metadata: {
      shareTitle: title || undefined,
      shareUrl: sourceUrl || undefined,
      intakeSurface: 'pwa_share_target',
    },
  };
}

export function sharedOpportunityToCaptureInput(
  userId: string,
  input: SharedOpportunityInput,
  source: CaptureSource = 'pwa_share',
): CreateCaptureInput {
  const parsed = parseSharedOpportunity(input);

  return {
    userId,
    source,
    method: parsed.method,
    title: parsed.roleTitle || undefined,
    url: parsed.sourceUrl || undefined,
    rawText: parsed.rawText || undefined,
    metadata: parsed.metadata,
  };
}
