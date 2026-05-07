import {
  buildDailyDigestTemplate,
  buildFollowUpReminderTemplate,
  mapCaptureResultToTelegramReply,
  parseTelegramUpdate,
  telegramPayloadToCaptureInput,
} from '../adapter';

describe('Telegram intake adapter', () => {
  it('parses a forwarded Telegram job link into a Capture Inbox payload', () => {
    const parsed = parseTelegramUpdate({
      update_id: 42,
      message: {
        message_id: 7,
        chat: { id: 12345, type: 'private' },
        text: 'Forwarded role\nhttps://jobs.example/growth-lead\nGrowth Lead at Acme',
        entities: [{ type: 'url', offset: 15, length: 31 }],
        from: { id: 99, first_name: 'Kaze' },
      },
    });

    expect(parsed.status).toBe('parsed');
    if (parsed.status !== 'parsed') throw new Error('Expected parsed update');
    expect(parsed.payload).toMatchObject({
      chatId: '12345',
      messageId: '7',
      url: 'https://jobs.example/growth-lead',
      rawText: 'Forwarded role\nhttps://jobs.example/growth-lead\nGrowth Lead at Acme',
      title: 'Forwarded role',
    });
  });

  it('returns needs_review when a Telegram message has no usable text or link', () => {
    const parsed = parseTelegramUpdate({
      update_id: 43,
      message: {
        message_id: 8,
        chat: { id: 12345, type: 'private' },
        photo: [{ file_id: 'file-1' }],
      },
    });

    expect(parsed).toMatchObject({
      status: 'needs_review',
      reason: 'No link or text found in Telegram message.',
    });
  });

  it('maps Telegram payloads and duplicate results to operator-safe replies', () => {
    const captureInput = telegramPayloadToCaptureInput('user-1', {
      chatId: '12345',
      messageId: '7',
      rawText: 'Growth Lead at Acme',
      title: 'Growth Lead',
      url: 'https://jobs.example/growth-lead',
    });

    expect(captureInput).toMatchObject({
      userId: 'user-1',
      source: 'telegram',
      method: 'url',
      title: 'Growth Lead',
      url: 'https://jobs.example/growth-lead',
    });

    expect(
      mapCaptureResultToTelegramReply({
        status: 'duplicate',
        title: 'Growth Lead',
        inboxUrl: 'https://jata.example/capture-inbox',
      }),
    ).toContain('Duplicate detected');
  });

  it('renders digest and follow-up reminder templates without secrets', () => {
    expect(
      buildDailyDigestTemplate({
        dateLabel: '2026-05-07',
        capturedCount: 3,
        duplicateCount: 1,
        needsReviewCount: 2,
        inboxUrl: 'https://jata.example/capture-inbox',
      }),
    ).toContain('Daily Capture Digest');

    expect(
      buildFollowUpReminderTemplate({
        title: 'Growth Lead',
        company: 'Acme',
        dueLabel: 'today',
        inboxUrl: 'https://jata.example/capture-inbox',
      }),
    ).toContain('Follow-up reminder');
  });
});
