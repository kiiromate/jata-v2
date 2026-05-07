import type { SupabaseClient } from '@supabase/supabase-js';
import type { CaptureInboxItem, CaptureMethod, CaptureSource, CaptureStatus } from '@jata/common';
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
  source?: CaptureSource;
  method?: CaptureMethod;
  title?: string | null;
  company?: string | null;
  url?: string | null;
  rawText?: string | null;
  industry?: string | null;
  sourceLabel?: string | null;
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
      source: input.source ?? 'manual',
      method: input.method ?? 'manual',
      title: input.title ?? undefined,
      company: input.company ?? undefined,
      url: input.url ?? undefined,
      rawText: input.rawText ?? undefined,
      industry: input.industry ?? undefined,
      metadata: input.metadata,
      parsed: {
        title: input.title ?? undefined,
        company: input.company ?? undefined,
        jobDescription: input.rawText ?? undefined,
        industry: input.industry ?? undefined,
        url: input.url ?? undefined,
        metadata: {
          ...input.metadata,
          sourceLabel: input.sourceLabel ?? undefined,
        },
      },
      parseStatus: input.rawText || input.title || input.company ? 'completed' : 'not_started',
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
