// Capture repair provider interfaces — stubs only in this pass.
// No external provider (Apify, Crawlee, Playwright) is wired up here.
// Future: register providers and dispatch from an Edge Function repair job handler.
// Each provider must implement CaptureRepairProvider, return result to Capture Inbox,
// and let the user approve/edit/reject before any application is created.

export type {
  CaptureRepairJob,
  CaptureRepairProvider,
  CaptureRepairProviderType,
  CaptureRepairStatus,
} from './types.ts';

import type { CaptureRepairJob } from './types.ts';

export function makeNotConfiguredJob(captureId: string, sourceUrl: string): CaptureRepairJob {
  const now = new Date().toISOString();
  return {
    captureId,
    sourceUrl,
    provider: 'local',
    status: 'not_configured',
    createdAt: now,
    updatedAt: now,
  };
}
