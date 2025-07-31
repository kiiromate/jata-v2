
```markdown
# JATA V2 - Phase 4 Build Plan: Browser Extension

**Objective**: To build a Manifest V3 browser extension for JATA that allows users to interactively scrape job details from any webpage and save them directly to their Supabase backend, following the architecture defined in the root `GEMINI.md`.

**Strategy**: We will use the Gemini CLI to generate each core component of the extension in the correct order, ensuring architectural compliance at each step.

---

### **Step 1: Generate the Extension Manifest**

**Goal**: Create the `manifest.json` file, the blueprint of the extension.

**Action**: Use the Gemini CLI to generate the manifest file.

**CLI Command**:
```bash
gemini -p "Generate the complete JSON for the file apps/extension/manifest.json. This must be a Manifest V3 extension, as per the JATA architecture guide. Include 'name', 'version', and 'description'. It must have 'storage', 'scripting', and 'activeTab' permissions, and host permissions for '<all_urls>'. Define the background service worker as 'src/background.js' and the action's default_popup as 'index.html'."
```

---

### **Step 2: Generate the Background Service Worker**

**Goal**: Create the `background.ts` script to act as the central message router.

**Action**: Use the Gemini CLI to generate the service worker.

**CLI Command**:
```bash
gemini -p "Generate the full TypeScript code for the file apps/extension/src/background.ts. This script must implement the message routing protocol from the JATA architecture guide. It should have one chrome.runtime.onMessage listener. This listener forwards any message it receives to the content script in the currently active tab using chrome.tabs.sendMessage. It also needs a chrome.runtime.onInstalled listener to set up initial state if needed. Add JSDoc comments."
```

---

### **Step 3: Generate the Interactive Content Scraper**

**Goal**: Create the `scraper.ts` content script with the interactive mapping logic.

**Action**: Use the Gemini CLI to generate the content script.

**CLI Command**:
```bash
gemini -p "Generate the full TypeScript code for the file apps/extension/src/contentScripts/scraper.ts. This script must listen for messages from the background script. On receiving a 'startScraping' message, it must implement the Interactive Mapping flow: 1. Create and inject a visual overlay into the DOM. 2. Add a 'mouseover' event listener to the document to highlight elements. 3. Add a single-use 'click' event listener that prevents the default action, captures the clicked element's textContent and a unique CSS selector, sends this data back via chrome.runtime.sendMessage, and then immediately removes the overlay and all event listeners to clean up the page."
```

---

### **Step 4: Generate the Popup UI**

**Goal**: Create the React component for the extension's popup, which controls the scraping process.

**Action**: Use the Gemini CLI to generate the `App.tsx` for the popup.

**CLI Command**:
```bash
gemini -p "Generate the full React component for the file apps/extension/src/App.tsx. Use TypeScript and Tailwind CSS, adhering to the JATA design system. The component must manage state for scraped data ('title', 'company', etc.). For each field, it needs a 'Select' button that initiates the scraping process by sending a message through the background script. It must also have a listener for 'elementSelected' messages to receive data from the content script and update its state. Finally, include a 'Save' button that calls the backend API to save the completed application data."
```

---

### **Step 5: Final Assembly and Local Testing**

**Goal**: Build the extension and load it into the browser for a full end-to-end test.

**Instructions**:
1.  **Build the extension**:
    ```bash
    pnpm --filter @jata/extension build
    ```
2.  **Load the extension in Chrome/Edge**:
    -   Navigate to `chrome://extensions`.
    -   Enable "Developer mode".
    -   Click "Load unpacked" and select the `apps/extension/dist` directory.
3.  **Test the Full Flow**:
    -   Log into your JATA web dashboard first to establish a session.
    -   Navigate to a job posting.
    -   Open the extension popup.
    -   Use the "Select" buttons to capture the job details.
    -   Verify the data appears correctly in the popup's form.
    -   Click "Save" and confirm the new entry appears in your Supabase database and on your web dashboard after a refresh.

```