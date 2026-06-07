import type { CaptureInboxItem, CreateCaptureInput } from '../../../../packages/common/src/captureInbox';
import { extractFirstUrl } from '../../../../packages/common/src/shareIntake';

type TelegramEntityType = 'url' | 'text_link' | string;

interface TelegramEntity {
  type: TelegramEntityType;
  offset: number;
  length: number;
  url?: string;
}

interface TelegramChat {
  id: number | string;
  type?: string;
}

interface TelegramUser {
  id: number | string;
  first_name?: string;
  username?: string;
}

interface TelegramMessage {
  message_id: number | string;
  chat: TelegramChat;
  from?: TelegramUser;
  text?: string;
  caption?: string;
  entities?: TelegramEntity[];
  caption_entities?: TelegramEntity[];
  forward_origin?: unknown;
  photo?: unknown[];
}

export interface TelegramUpdate {
  update_id: number | string;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
}

export interface TelegramParsedPayload {
  chatId: string;
  messageId: string;
  senderId?: string;
  senderUsername?: string;
  rawText: string;
  title: string;
  url?: string;
  metadata: Record<string, string | number | boolean | null>;
}

export type TelegramParseResult =
  | { status: 'parsed'; payload: TelegramParsedPayload }
  | { status: 'needs_review'; reason: string; chatId?: string; messageId?: string };

export interface TelegramReplyInput {
  status: 'captured' | 'duplicate' | 'possible_duplicate' | 'needs_review' | 'failed';
  title?: string | null;
  reason?: string;
  inboxUrl?: string;
}

export interface DailyDigestTemplateInput {
  dateLabel: string;
  capturedCount: number;
  duplicateCount: number;
  needsReviewCount: number;
  inboxUrl: string;
}

export interface FollowUpReminderTemplateInput {
  title: string;
  company?: string | null;
  dueLabel: string;
  inboxUrl: string;
}

function clean(value: string | null | undefined): string {
  return value?.trim() || '';
}

function readMessage(update: TelegramUpdate): TelegramMessage | undefined {
  return update.message || update.edited_message;
}

function sliceTelegramText(text: string, entity: TelegramEntity): string {
  return text.slice(entity.offset, entity.offset + entity.length);
}

function isTelegramUrlBoundary(value: string): boolean {
  return /\s|[<>"')\]]/.test(value);
}

function sliceTelegramUrlCandidate(text: string, entity: TelegramEntity): string {
  let start = Math.max(0, Math.min(entity.offset, text.length));
  let end = Math.max(start, Math.min(entity.offset + entity.length, text.length));

  while (start > 0 && !isTelegramUrlBoundary(text[start - 1])) start -= 1;
  while (end < text.length && !isTelegramUrlBoundary(text[end])) end += 1;

  return text.slice(start, end);
}

function urlFromEntities(text: string, entities: TelegramEntity[] = []): string {
  for (const entity of entities) {
    if (entity.type === 'text_link' && entity.url) return entity.url;
    if (entity.type === 'url') {
      return (
        extractFirstUrl(sliceTelegramUrlCandidate(text, entity)) ||
        extractFirstUrl(sliceTelegramText(text, entity)) ||
        extractFirstUrl(text)
      );
    }
  }

  return '';
}

function firstUsefulTitle(text: string): string {
  const url = extractFirstUrl(text);
  return (
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line && line !== url && !line.startsWith('http')) || 'Telegram opportunity'
  );
}

export function parseTelegramUpdate(update: TelegramUpdate): TelegramParseResult {
  const message = readMessage(update);
  if (!message) {
    return { status: 'needs_review', reason: 'No Telegram message found in update.' };
  }

  const text = clean(message.text || message.caption);
  const chatId = String(message.chat.id);
  const messageId = String(message.message_id);
  const entities = message.text ? message.entities : message.caption_entities;
  const entityUrl = urlFromEntities(text, entities);
  const url = clean(entityUrl || extractFirstUrl(text));

  if (!text && !url) {
    return {
      status: 'needs_review',
      reason: 'No link or text found in Telegram message.',
      chatId,
      messageId,
    };
  }

  return {
    status: 'parsed',
    payload: {
      chatId,
      messageId,
      senderId: message.from ? String(message.from.id) : undefined,
      senderUsername: message.from?.username,
      rawText: text || url,
      title: firstUsefulTitle(text || url),
      url: url || undefined,
      metadata: {
        telegramChatId: chatId,
        telegramMessageId: messageId,
        telegramSenderId: message.from ? String(message.from.id) : null,
        telegramSenderUsername: message.from?.username || null,
        forwarded: Boolean(message.forward_origin),
      },
    },
  };
}

export function telegramPayloadToCaptureInput(
  userId: string,
  payload: TelegramParsedPayload,
): CreateCaptureInput {
  return {
    userId,
    source: 'telegram',
    method: payload.url ? 'url' : 'message',
    title: payload.title,
    url: payload.url,
    rawText: payload.rawText,
    metadata: payload.metadata,
  };
}

export function mapCaptureResultToTelegramReply(input: TelegramReplyInput): string {
  const title = clean(input.title) || 'Opportunity';
  const suffix = input.inboxUrl ? `\nReview: ${input.inboxUrl}` : '';

  if (input.status === 'captured') return `Captured: ${title}${suffix}`;
  if (input.status === 'duplicate') return `Duplicate detected: ${title}${suffix}`;
  if (input.status === 'possible_duplicate') return `Possible duplicate: ${title}${suffix}`;
  if (input.status === 'needs_review') {
    return `Needs review: ${input.reason || 'I could not find a usable job link or message.'}${suffix}`;
  }

  return `Failed to capture: ${input.reason || 'Check Telegram intake configuration.'}${suffix}`;
}

export function captureItemToReplyStatus(item: CaptureInboxItem): TelegramReplyInput['status'] {
  if (item.duplicateStatus === 'duplicate') return 'duplicate';
  if (item.duplicateStatus === 'possible_duplicate') return 'possible_duplicate';
  return 'captured';
}

export function buildDailyDigestTemplate(input: DailyDigestTemplateInput): string {
  return [
    `Daily Capture Digest - ${input.dateLabel}`,
    `Captured: ${input.capturedCount}`,
    `Duplicates: ${input.duplicateCount}`,
    `Needs review: ${input.needsReviewCount}`,
    `Inbox: ${input.inboxUrl}`,
  ].join('\n');
}

export function buildFollowUpReminderTemplate(input: FollowUpReminderTemplateInput): string {
  const company = clean(input.company);
  const subject = company ? `${input.title} at ${company}` : input.title;

  return [
    `Follow-up reminder: ${subject}`,
    `Due: ${input.dueLabel}`,
    `Inbox: ${input.inboxUrl}`,
  ].join('\n');
}
