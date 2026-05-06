import { serve } from 'std/http/server.ts';
import { z } from 'zod';
import { corsHeaders } from '../_shared/cors.ts';
import { createSupabaseClient, getUserId } from '../_shared/db.ts';
import {
  CaptureMethods,
  CaptureSources,
  CaptureStatuses,
  DuplicateStatuses,
  type Json,
  ParseStatuses,
  ScoreStatuses,
} from '../../../packages/common/src/captureInbox.ts';
import {
  createCaptureInboxService,
  createSupabaseCaptureInboxRepository,
} from '../_shared/capture/service.ts';

const SourceSchema = z.enum(CaptureSources);
const MethodSchema = z.enum(CaptureMethods);
const CaptureStatusSchema = z.enum(CaptureStatuses);
const ParseStatusSchema = z.enum(ParseStatuses);
const ScoreStatusSchema = z.enum(ScoreStatuses);
const DuplicateStatusSchema = z.enum(DuplicateStatuses);
const RouteActions = ['archive', 'score', 'promote_to_shortlist', 'request_pack', 'generate_pack_later'] as const;

const JsonValueSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([
    z.string(),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    z.record(JsonValueSchema),
  ]),
);
const MetadataSchema = z.record(JsonValueSchema).optional();
const ParsedPayloadSchema = z.object({
  title: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  jobDescription: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  url: z.string().url().optional().nullable(),
  metadata: MetadataSchema,
}).optional();

const CreateCaptureSchema = z.object({
  action: z.literal('create').optional(),
  source: SourceSchema,
  method: MethodSchema,
  url: z.string().url().optional().nullable(),
  rawText: z.string().max(50000).optional().nullable(),
  title: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  metadata: MetadataSchema,
  parsed: ParsedPayloadSchema,
  parseStatus: ParseStatusSchema.optional(),
});

const UpdateCaptureSchema = z.object({
  action: z.literal('update').optional(),
  captureId: z.string().uuid().optional(),
  source: SourceSchema.optional(),
  method: MethodSchema.optional(),
  status: CaptureStatusSchema.optional(),
  parseStatus: ParseStatusSchema.optional(),
  scoreStatus: ScoreStatusSchema.optional(),
  duplicateStatus: DuplicateStatusSchema.optional(),
  rawText: z.string().max(50000).optional().nullable(),
  url: z.string().url().optional().nullable(),
  title: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  metadata: MetadataSchema,
  parsed: ParsedPayloadSchema,
});

const ScoreCaptureSchema = z.object({
  action: z.literal('score'),
  captureId: z.string().uuid().optional(),
  score: z.number().min(0).max(100),
  matchedSkills: z.array(z.string()).optional(),
  missingSkills: z.array(z.string()).optional(),
  suggestions: z.array(z.string()).optional(),
  atsScore: z.number().min(0).max(100).optional(),
  atsIssues: z.array(z.string()).optional(),
  metadata: MetadataSchema,
});

const IdActionSchema = z.object({
  action: z.enum(['archive', 'promote_to_shortlist', 'request_pack', 'generate_pack_later']),
  captureId: z.string().uuid().optional(),
});

const BodyActionSchema = z.object({
  action: z.string().optional(),
}).passthrough();

class InvalidJsonBodyError extends Error {
  constructor() {
    super('Invalid JSON request body');
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}

async function readJsonBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new InvalidJsonBodyError();
  }
}

function readAction(body: unknown): string {
  const parsed = BodyActionSchema.safeParse(body);
  return parsed.success ? parsed.data.action || 'create' : 'create';
}

function readCaptureId(url: URL, bodyCaptureId?: string): string | null {
  if (bodyCaptureId) return bodyCaptureId;
  const queryId = url.searchParams.get('id');
  if (queryId) return queryId;

  const parts = url.pathname.split('/').filter(Boolean);
  const last = parts[parts.length - 1];
  const maybeAction = RouteActions.includes(last as (typeof RouteActions)[number]);
  const candidate = maybeAction ? parts[parts.length - 2] : last;
  if (!candidate || candidate === 'capture-inbox') return null;
  return candidate;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createSupabaseClient(req);
  const userId = await getUserId(req);
  if (!userId) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const service = createCaptureInboxService({
    repository: createSupabaseCaptureInboxRepository(supabase),
  });

  try {
    const url = new URL(req.url);

    if (req.method === 'GET') {
      const status = CaptureStatusSchema.safeParse(url.searchParams.get('status'));
      const source = SourceSchema.safeParse(url.searchParams.get('source'));
      const result = await service.listCaptures({
        userId,
        status: status.success ? status.data : undefined,
        source: source.success ? source.data : undefined,
        includeArchived: url.searchParams.get('includeArchived') === 'true',
        limit: Number.parseInt(url.searchParams.get('limit') || '50', 10),
        offset: Number.parseInt(url.searchParams.get('offset') || '0', 10),
      });

      return jsonResponse(result);
    }

    if (req.method === 'PATCH') {
      const body = await readJsonBody(req);
      const parsed = UpdateCaptureSchema.safeParse(body);
      if (!parsed.success) {
        return jsonResponse({ error: 'Invalid request body', details: parsed.error.flatten() }, 400);
      }

      const captureId = readCaptureId(url, parsed.data.captureId);
      if (!captureId) return jsonResponse({ error: 'Capture ID is required' }, 400);

      const item = await service.updateCapture({
        ...parsed.data,
        userId,
        captureId,
      });

      return jsonResponse(item);
    }

    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    const body = await readJsonBody(req);
    const action = readAction(body);

    if (action === 'create') {
      const parsed = CreateCaptureSchema.safeParse(body);
      if (!parsed.success) {
        return jsonResponse({ error: 'Invalid request body', details: parsed.error.flatten() }, 400);
      }

      const item = await service.createCapture({ ...parsed.data, userId });
      return jsonResponse(item, 201);
    }

    if (action === 'score') {
      const parsed = ScoreCaptureSchema.safeParse(body);
      if (!parsed.success) {
        return jsonResponse({ error: 'Invalid request body', details: parsed.error.flatten() }, 400);
      }

      const captureId = readCaptureId(url, parsed.data.captureId);
      if (!captureId) return jsonResponse({ error: 'Capture ID is required' }, 400);

      const item = await service.scoreCapture({
        ...parsed.data,
        userId,
        captureId,
      });
      return jsonResponse(item);
    }

    const parsed = IdActionSchema.safeParse(body);
    if (!parsed.success) {
      return jsonResponse({ error: 'Invalid request body', details: parsed.error.flatten() }, 400);
    }

    const captureId = readCaptureId(url, parsed.data.captureId);
    if (!captureId) return jsonResponse({ error: 'Capture ID is required' }, 400);

    if (parsed.data.action === 'archive') {
      return jsonResponse(await service.archiveCapture({ userId, captureId }));
    }

    if (parsed.data.action === 'promote_to_shortlist') {
      return jsonResponse(await service.promoteToShortlist({ userId, captureId }));
    }

    return jsonResponse(await service.requestPackGeneration({ userId, captureId }));
  } catch (error) {
    if (error instanceof InvalidJsonBodyError) {
      return jsonResponse({ error: error.message }, 400);
    }

    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Capture Inbox error:', message);
    return jsonResponse({ error: message }, 500);
  }
});
