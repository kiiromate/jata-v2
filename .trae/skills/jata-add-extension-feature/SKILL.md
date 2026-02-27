---
name: jata-add-extension-feature
description: Adds a new extension feature with typed messaging and safe DOM scraping. Invoke when updating apps/extension behavior.
---

# Add browser extension feature

## When to invoke
- You need to change scraping behavior
- You need new background logic or storage
- You need new popup UI behavior

## Inputs to collect
- Target domain(s)
- Data to extract or action to perform
- Where it runs (content script, background, popup)

## Implementation steps
1. Content script changes live in `apps/extension/src/contentScripts/*`.
2. Background logic lives in `apps/extension/src/background.ts`.
3. Validate all messages received by the background.
4. Keep permissions minimal and restrict matches in `manifest.json`.

## Code standards
- Add concise function-level comments for new functions.
- Treat page DOM as untrusted input.
- Never embed secrets in the extension.

## Verification
- Build and load the unpacked extension from `apps/extension/dist/`.
- Test on the target domain and confirm no console errors.

## Example invocation
"Update the LinkedIn scraper to extract job title and company name using data attributes, then send it to the background for saving."