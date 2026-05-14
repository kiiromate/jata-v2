# Work Package B — Extension Pick Flow & Pack Trigger

## Agent Role
Browser extension engineer responsible for fixing the broken pick flow and adding a pack generation trigger.

## Recommended Tool
**Gemini CLI** (strong web search for Chrome Manifest V3 docs) or **Claude Code** (has chrome-devtools and google-developer-knowledge MCPs).

## Phase
**Phase 1** — Start immediately. No dependencies on other agents.

## Branch
```
git checkout -b fix/extension-pick-flow
```

## MCP Tools Available (if using Claude Code)
- **google-developer-knowledge** — Chrome extension APIs, Manifest V3 storage and messaging
- **chrome-devtools** — Live testing of the extension in Chrome
- **brave-search** / **tavily** — Research Manifest V3 patterns for multi-field pickers

---

## Repo Context

JATA v2 is a job application system. The browser extension (`apps/extension/`) captures job opportunities from web pages and sends them to JATA's Capture Inbox.

### Extension structure
```
apps/extension/src/
  App.tsx                    ← Popup UI (React)
  background.ts              ← Service worker
  main.tsx                   ← Popup entry point
  contentScripts/
    scraper.ts               ← Auto-scrapes job data from the current page
    selectionPopover.ts      ← Handles user "Pick" mode for manual field selection
  lib/
    captureConfidence.ts     ← Scores extraction quality
    captureInboxClient.ts    ← Sends captured data to JATA backend
```

### Tech stack
- Manifest V3 (service worker, not persistent background page)
- React popup UI built with Vite
- Content scripts injected into job pages

### Build
```powershell
pnpm --filter @jata/extension build
```

---

## File Ownership (ONLY touch these files)

```
apps/extension/src/          ← Entire directory is yours
```

**Do NOT touch:** `apps/web/`, `packages/common/`, `supabase/`, `scripts/`, or any file outside `apps/extension/`.

---

## Bug 1: Pick Flow Loses State on Popup Close

### Current broken behavior
1. User clicks "Pick" button next to a field (e.g., Job Title) in the extension popup.
2. Popup enters selection mode — page elements highlight on hover via `selectionPopover.ts`.
3. User clicks a highlighted element on the page.
4. **The popup closes** (this is Chrome's default behavior when focus leaves the popup).
5. The selected value does NOT appear in the popup field.
6. When the user reopens the popup, `scraper.ts` runs an auto-scan and **overwrites all fields** — including any values the user previously picked.
7. The user cannot complete a multi-field pick sequence without losing work.

### Root cause
- Chrome Manifest V3 popups close when they lose focus. This is not a bug — it's platform behavior.
- There is no persistent state layer between popup open/close cycles.
- `scraper.ts` re-scans on every popup open, overwriting everything.

### Fix approach

**Step 1: Persist picked values across popup open/close cycles.**

Use `chrome.storage.session` (Manifest V3 session storage — cleared when browser closes, persists across popup cycles):

```typescript
// When user picks a value via selectionPopover.ts:
chrome.storage.session.set({
  pickedFields: {
    jobTitle: "Senior Engineer",    // user picked this
    company: null,                   // not yet picked
    description: null,              // not yet picked
  },
  pickMode: true,  // flag that user is in manual pick mode
});
```

**Step 2: On popup open, check for picked values before auto-scanning.**

In `App.tsx` (or wherever the popup initializes):

```typescript
// Pseudocode
const stored = await chrome.storage.session.get(['pickedFields', 'pickMode']);
if (stored.pickMode && stored.pickedFields) {
  // Restore picked values — do NOT run auto-scan for fields that have values
  populateFields(stored.pickedFields);
} else {
  // Normal flow — run auto-scan
  runAutoScan();
}
```

**Step 3: Communicate picked value from content script to storage.**

When the user clicks an element in `selectionPopover.ts`:

```typescript
// selectionPopover.ts — on element click
const selectedText = element.textContent?.trim();
const fieldName = getCurrentPickField(); // which field was being picked

// Send to background via message passing
chrome.runtime.sendMessage({
  type: 'FIELD_PICKED',
  field: fieldName,
  value: selectedText,
});
```

In `background.ts` (service worker):

```typescript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FIELD_PICKED') {
    chrome.storage.session.get(['pickedFields'], (result) => {
      const fields = result.pickedFields || {};
      fields[message.field] = message.value;
      chrome.storage.session.set({ pickedFields: fields, pickMode: true });
    });
  }
});
```

### Research before implementing
- Read `selectionPopover.ts` and `scraper.ts` to understand the current implementation.
- Check which Chrome APIs are available in Manifest V3 service workers vs. content scripts.
- `chrome.storage.session` requires `"storage"` permission in manifest.json — verify it's already there.
- Use google-developer-knowledge or brave-search for `chrome.storage.session` API reference.

### Acceptance criteria
- [ ] User picks a field → popup closes → user reopens popup → picked value is still there
- [ ] Auto-scan does not overwrite user-picked values
- [ ] User can pick multiple fields in sequence (Title, Company, Description) across popup open/close cycles
- [ ] A "Clear picks" or "Re-scan" button exists so the user can reset and start fresh
- [ ] Pick mode is exited when the user clicks "Send to JATA" or manually clears

---

## Bug 2: Add Pack Generation Trigger

### Current state
The extension can capture a job and send it to Capture Inbox. But there is no path to generate an application pack from within the extension.

### What to build
Add a secondary CTA in the extension popup:

```
[ Send to JATA ]    ← existing — sends to Capture Inbox
[ Generate Pack → ] ← NEW — opens ResumeTailorPage with this job pre-loaded
```

The "Generate Pack" button should:
1. Check if the user is signed in (check auth state).
2. If signed in: open a new tab to JATA's ResumeTailorPage with the job data as URL parameters or by storing the job data in `chrome.storage.session` and passing a flag.
3. If not signed in: show a "Sign in to generate packs" message.

### Implementation approach

```typescript
// In App.tsx, add the button
<button onClick={handleGeneratePack} disabled={!isSignedIn}>
  Generate Pack →
</button>

async function handleGeneratePack() {
  const jobData = getCurrentFormData(); // the scraped/picked job data
  
  // Store in session for the web app to pick up
  await chrome.storage.session.set({ pendingPackJob: jobData });
  
  // Open ResumeTailorPage
  const webAppUrl = 'https://your-jata-domain.com/resume-tailor';
  chrome.tabs.create({ url: `${webAppUrl}?from=extension` });
}
```

**Important:** The web app URL should come from a config, not be hardcoded. Check if there's already a `JATA_WEB_URL` or similar constant in the extension code.

### Acceptance criteria
- [ ] "Generate Pack" button appears in the popup when user is signed in
- [ ] Button is disabled/hidden when user is not signed in
- [ ] Clicking the button opens ResumeTailorPage in a new tab
- [ ] Job data (title, company, description, URL) is passed to the web app
- [ ] Extension build passes: `pnpm --filter @jata/extension build`

---

## Validation (run before committing)

```powershell
git diff --check
pnpm --filter @jata/extension build
pnpm build
```

Test manually:
1. Load the unpacked extension in Chrome (`chrome://extensions` → Load unpacked → `apps/extension/dist`)
2. Navigate to a job posting (Greenhouse, Lever, or generic)
3. Test pick flow: pick Title → popup closes → reopen → Title value persists
4. Test multi-field pick: pick Title, then Company, then Description in sequence
5. Test "Clear picks" resets to auto-scan
6. Test "Generate Pack" button opens ResumeTailorPage

---

## Git Discipline

- Stage only files in `apps/extension/src/`.
- Never stage `.env`, `.mcp.json`, `.claude/`, `node_modules/`, `dist/`.
- Commit message format: `fix(extension): <what changed>`
- Separate commits for pick flow fix and pack trigger feature.

---

## Report When Done

Provide:
1. Branch name
2. Commit hashes
3. Files changed (list)
4. Validation commands run and results
5. Manual test results (what worked, what didn't)
6. Any limitations or known issues

---

## Do NOT

- Do not touch any files outside `apps/extension/src/`
- Do not modify Supabase Edge Functions or migrations
- Do not modify `packages/common/`
- Do not add heavy npm dependencies to the extension (bundle size matters)
- Do not implement form autofill in this work package (that's a future phase)
- Do not bypass Chrome platform restrictions
- Do not add permissions to manifest.json beyond what's strictly needed (`storage` if not already there)
- Do not auto-submit applications
- Do not scrape content from pages the user has not navigated to
