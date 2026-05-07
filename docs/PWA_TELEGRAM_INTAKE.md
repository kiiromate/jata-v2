# PWA Share Target And Telegram Intake

Date: 2026-05-07

## Scope

Wave 5 adds two intake paths into the existing Capture Inbox:

- Mobile PWA share target: supported browsers can share links/text to JATA.
- Optional Telegram bridge: forwarded job links/messages can become Capture Inbox items when configured.

Core JATA does not require Telegram. Leave Telegram env vars blank to disable that path.

## Mobile PWA Install And Share Test

1. Build and deploy or preview the web app over HTTPS. Browser share targets generally require an installed PWA and secure origin.
2. Open JATA on the phone and sign in.
3. Install the PWA from the browser menu.
4. From a job page or message, use the mobile OS share sheet and choose JATA.
5. Confirm JATA opens `/capture/share` with the shared title, URL, or text prefilled.
6. Review the Quick Capture fields and click `Save to Capture Inbox`.
7. Confirm the item appears in `/capture-inbox`.

Fallback:

- Open `/capture-inbox` or `/capture/share`.
- Use the `Paste` button, or paste the link/text manually into Quick Capture.
- Save the item into Capture Inbox.

Known browser constraint:

- Web Share Target support varies by browser and platform. Where unsupported, the paste fallback is the intended path.

## Telegram Optional Setup

Environment variables for Supabase Edge Functions:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_CAPTURE_USER_ID=
TELEGRAM_DEV_MODE=false
JATA_WEB_APP_URL=
SITE_URL=
```

Notes:

- `TELEGRAM_BOT_TOKEN` is private. Never commit or print it.
- `TELEGRAM_CAPTURE_USER_ID` is the JATA user UUID that owns Telegram-created captures.
- `TELEGRAM_WEBHOOK_SECRET` should match Telegram's `secret_token` webhook header in production.
- `TELEGRAM_DEV_MODE=true` allows local/dev POST tests when `TELEGRAM_WEBHOOK_SECRET` is blank.
- `JATA_WEB_APP_URL` is used in Telegram replies. `SITE_URL` is a fallback.

Deploy when ready:

```powershell
pnpm exec supabase functions deploy telegram-intake
```

Dev mode smoke payload:

```powershell
$env:TELEGRAM_DEV_MODE="true"
$body = @{
  update_id = 1
  message = @{
    message_id = 10
    chat = @{ id = 12345; type = "private" }
    text = "Growth Lead at Acme`nhttps://jobs.example/growth-lead"
  }
} | ConvertTo-Json -Depth 5

Invoke-RestMethod `
  -Method Post `
  -Uri "http://127.0.0.1:54321/functions/v1/telegram-intake" `
  -ContentType "application/json" `
  -Body $body
```

Expected replies:

- Captured: the item was created in Capture Inbox.
- Duplicate detected: exact URL duplicate found.
- Possible duplicate: same title/company pattern found.
- Needs review: no usable link or text was found.
- Failed: configuration or database write failed.

## Digest And Reminder Templates

The Telegram adapter exposes reusable text templates:

- Daily digest: captured count, duplicates, needs-review count, inbox URL.
- Follow-up reminder: role/company, due label, inbox URL.

These are templates only. No scheduler or outbound reminder automation is enabled by default in Wave 5.

## Privacy And Security

- Telegram remains optional and disabled without env configuration.
- No bot token is stored in source.
- Service role key is server-only for the Edge Function and must not be exposed to the web app.
- Do not configure official WhatsApp intake yet.
