import type { SupabaseClient } from '@supabase/supabase-js';
import type { CaptureInboxItem, CaptureSource, CaptureStatus } from '@jata/common';
import { getSupabaseFunctionUrl } from '@/lib/supabaseClient';

export interface ListCapturesParams {
  status?: CaptureStatus;
  source?: CaptureSource;
  includeArchived?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreateCaptureInput {
  userId: string;
  title?: string | null;
  company?: string | null;
  url?: string | null;
  rawText?: string | null;
  metadata?: Record<string, string | undefined>;
}

export async function listCaptures(
  supabase: SupabaseClient,
  params: ListCapturesParams = {}
): Promise<CaptureInboxItem[]> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  const url = new URL(getSupabaseFunctionUrl('capture-inbox'));
  if (params.status) url.searchParams.set('status', params.status);
  if (params.source) url.searchParams.set('source', params.source);
  if (params.includeArchived) url.searchParams.set('includeArchived', 'true');
  url.searchParams.set('limit', String(params.limit ?? 50));
  url.searchParams.set('offset', String(params.offset ?? 0));

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error((json as { error?: string }).error ?? 'Failed to load captures');
  }

  const json = await res.json();
  return (json.items ?? []) as CaptureInboxItem[];
}

export async function createCapture(
  supabase: SupabaseClient,
  input: CreateCaptureInput
): Promise<CaptureInboxItem> {
  const { data, error } = await supabase.functions.invoke('capture-inbox', {
    body: {
      action: 'create',
      source: 'manual',
      method: 'manual',
      title: input.title ?? undefined,
      company: input.company ?? undefined,
      url: input.url ?? undefined,
      rawText: input.rawText ?? undefined,
      metadata: input.metadata,
    },
  });
  if (error) throw new Error(error.message);
  return data as CaptureInboxItem;
}

export async function archiveCapture(
  supabase: SupabaseClient,
  captureId: string
): Promise<CaptureInboxItem> {
  const { data, error } = await supabase.functions.invoke('capture-inbox', {
    body: { action: 'archive', captureId },
  });
  if (error) throw new Error(error.message);
  return data as CaptureInboxItem;
}

export async function promoteToShortlist(
  supabase: SupabaseClient,
  captureId: string
): Promise<CaptureInboxItem> {
  const { data, error } = await supabase.functions.invoke('capture-inbox', {
    body: { action: 'promote_to_shortlist', captureId },
  });
  if (error) throw new Error(error.message);
  return data as CaptureInboxItem;
}

export async function generatePackLater(
  supabase: SupabaseClient,
  captureId: string
): Promise<CaptureInboxItem> {
  const { data, error } = await supabase.functions.invoke('capture-inbox', {
    body: { action: 'generate_pack_later', captureId },
  });
  if (error) throw new Error(error.message);
  return data as CaptureInboxItem;
}
