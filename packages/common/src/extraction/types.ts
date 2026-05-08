export interface ExtractionResult {
  title: string | null;
  company: string | null;
  location: string | null;
  description: string | null;
  requirements: string[];
  responsibilities: string[];
  employmentType: string | null;
  deadline: string | null;
  applyUrl: string | null;
  sourceUrl: string;
  sourceHost: string;
  sourceType: string;
  extractionMethod: string;
  adapterId: string;
  confidenceScore: number;
  missingFields: string[];
  warnings: string[];
  requiresReview: boolean;
  rawSignals?: Record<string, unknown>;
}

export interface ExtractionContext {
  url: string;
  title?: string | null;
  company?: string | null;
  location?: string | null;
  description?: string | null;
  applyUrl?: string | null;
  rawText?: string | null;
  jsonLd?: Record<string, unknown> | null;
}

export interface ExtractionAdapter {
  readonly id: string;
  readonly label: string;
  detect(url: string): boolean;
  normalize(context: ExtractionContext): Partial<ExtractionResult>;
  confidence(result: Partial<ExtractionResult>): number;
}

// Repair interface — provider stubs only, no runtime in this pass.
// Future: register providers and dispatch from an Edge Function repair job handler.
export type CaptureRepairProviderType = 'local' | 'apify' | 'crawlee' | 'playwright';

export type CaptureRepairStatus =
  | 'not_configured'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed';

export interface CaptureRepairJob {
  captureId: string;
  sourceUrl: string;
  provider: CaptureRepairProviderType;
  status: CaptureRepairStatus;
  result?: Partial<ExtractionResult>;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CaptureRepairProvider {
  readonly type: CaptureRepairProviderType;
  isConfigured(): boolean;
  enqueue(captureId: string, sourceUrl: string): Promise<CaptureRepairJob>;
}
