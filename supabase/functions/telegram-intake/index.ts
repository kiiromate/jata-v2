import { serve } from 'std/http/server.ts';
import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors.ts';
import {
  captureItemToReplyStatus,
  mapCaptureResultToTelegramReply,
  parseTelegramUpdate,
  telegramPayloadToCaptureInput,
  type TelegramUpdate,
} from '../_shared/telegram/adapter.ts';
import {
  createCaptureInboxService,
  createSupabaseCaptureInboxRepository,
} from '../_shared/capture/service.ts';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}

function env(name: string): string {
  return Deno.env.get(name)?.trim() || '';
}

function isDevMode(): boolean {
  return env('TELEGRAM_DEV_MODE').toLowerCase() === 'true';
}

function getInboxUrl(): string {
  const appUrl = env('JATA_WEB_APP_URL') || env('SITE_URL');
  return appUrl ? `${appUrl.replace(/\/$/, '')}/capture-inbox` : '/capture-inbox';
}

function isAuthorized(req: Request): boolean {
  const expectedSecret = env('TELEGRAM_WEBHOOK_SECRET');
  if (!expectedSecret) return isDevMode();
  return req.headers.get('x-telegram-bot-api-secret-token') === expectedSecret;
}

async function sendTelegramReply(chatId: string, text: string): Promise<void> {
  const token = env('TELEGRAM_BOT_TOKEN');
  if (!token) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
  } catch {
    // Capture should not fail just because Telegram reply delivery failed.
  }
}

function createServiceRoleClient() {
  const supabaseUrl = env('SUPABASE_URL');
  const serviceRoleKey = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return null;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (req.method === 'GET') {
    return jsonResponse({
      ok: true,
      configured: Boolean(env('TELEGRAM_CAPTURE_USER_ID') && createServiceRoleClient()),
      devMode: isDevMode(),
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  if (!isAuthorized(req)) {
    return jsonResponse({ error: 'Telegram intake is not authorized.' }, 401);
  }

  const ownerUserId = env('TELEGRAM_CAPTURE_USER_ID');
  const supabase = createServiceRoleClient();
  const inboxUrl = getInboxUrl();

  let update: TelegramUpdate;
  try {
    update = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid Telegram update JSON' }, 400);
  }

  const parsed = parseTelegramUpdate(update);
  if (parsed.status === 'needs_review') {
    const reply = mapCaptureResultToTelegramReply({
      status: 'needs_review',
      reason: parsed.reason,
      inboxUrl,
    });
    if (parsed.chatId) await sendTelegramReply(parsed.chatId, reply);
    return jsonResponse({ ok: true, status: 'needs_review', reply });
  }

  if (!ownerUserId || !supabase) {
    const reply = mapCaptureResultToTelegramReply({
      status: 'failed',
      reason: 'Telegram intake is not configured with a capture user and Supabase service role.',
      inboxUrl,
    });
    await sendTelegramReply(parsed.payload.chatId, reply);
    return jsonResponse({ ok: false, status: 'not_configured', reply }, 200);
  }

  try {
    const service = createCaptureInboxService({
      repository: createSupabaseCaptureInboxRepository(supabase),
    });
    const item = await service.createCapture(telegramPayloadToCaptureInput(ownerUserId, parsed.payload));
    const status = captureItemToReplyStatus(item);
    const reply = mapCaptureResultToTelegramReply({ status, title: item.title, inboxUrl });
    await sendTelegramReply(parsed.payload.chatId, reply);
    return jsonResponse({ ok: true, status, captureId: item.id, reply }, 201);
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown capture failure';
    const reply = mapCaptureResultToTelegramReply({ status: 'failed', reason, inboxUrl });
    await sendTelegramReply(parsed.payload.chatId, reply);
    return jsonResponse({ ok: false, status: 'failed', reply }, 500);
  }
});
