# JATA Browser Extension Design Document

This document provides a comprehensive guide to designing, implementing, and maintaining the JATA (Job Application Tracker & Optimization App) browser extension. It is intended to serve as a standalone resource for developers, detailing the extension's architecture, functionality, and integration with the JATA ecosystem.

---

## 1. Overview & Purpose

The JATA browser extension enhances the job application process by automating key tasks for users. Its primary roles are:

- **Job Data Extraction (Scraping):** Extracts job details from job boards like LinkedIn, Indeed, and Glassdoor.
- **Reverse-Autofill:** Populates job application forms with user profile data.
- **Integration with JATA Dashboard:** Syncs scraped data and user inputs with the JATA dashboard for tracking and analytics.

### Key Non-Functional Goals
- **Size:** Maintain an unpacked size below 100KB for fast downloads and minimal resource usage.
- **Responsiveness:** Ensure instant UI responses to user interactions for a seamless experience.
- **Error Handling:** Implement robust mechanisms to gracefully handle errors, providing actionable feedback to users.

---

## 2. Repository & Manifest

The extension resides in the `packages/extension` directory within the JATA monorepo, organized as follows:

### Directory Structure
```
packages/extension/
├── src/
│   ├── contentScripts/
│   │   ├── scraper.ts
│   │   └── autofill.ts
│   ├── background.ts
│   ├── popup/
│   │   ├── index.tsx
│   │   └── styles.css
│   └── options/
│       ├── index.tsx
│       └── styles.css
├── public/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── manifest.json
└── package.json
```

### Manifest.json Example
```json
{
  "manifest_version": 3,
  "name": "JATA Extension",
  "version": "1.0.0",
  "description": "Job Application Tracker & Optimization",
  "permissions": [
    "storage",
    "scripting",
    "activeTab",
    "declarativeNetRequest"
  ],
  "host_permissions": [
    "*://*.linkedin.com/*",
    "*://*.indeed.com/*",
    "*://*.glassdoor.com/*"
  ],
  "background": {
    "service_worker": "background.ts"
  },
  "content_scripts": [
    {
      "matches": ["*://*.linkedin.com/*", "*://*.indeed.com/*", "*://*.glassdoor.com/*"],
      "js": ["contentScripts/scraper.ts", "contentScripts/autofill.ts"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup/index.html",
    "default_icon": {
      "16": "icon16.png",
      "48": "icon48.png",
      "128": "icon128.png"
    }
  },
  "options_page": "options/index.html"
}
```

---

## 3. Permissions & Security

### Required Permissions
- **`storage`:** Stores user profiles, scrape configurations, and autofill mappings.
- **`scripting`:** Injects content scripts into web pages for scraping and autofill.
- **`activeTab`:** Accesses the current tab for user-initiated actions.
- **`declarativeNetRequest`:** Manages network requests for security and performance.

### Host Permissions
- `*://*.linkedin.com/*`, `*://*.indeed.com/*`, `*://*.glassdoor.com/*`: Allows interaction with major job boards where users apply.

### Security Considerations
- **Content Security Policy (CSP):** Enforces a strict policy to prevent unauthorized script execution and data leaks.
- **Declarative Net Request:** Blocks or modifies risky network requests.
- **Storage Strategy:** Uses `chrome.storage.local` for large data (e.g., profiles) and `chrome.storage.sync` for settings that sync across devices.

---

## 4. Content Scripts

### Scraper Script (`scraper.ts`)
- **Injection Rules:** Matches job board domains, runs at `document_idle`.
- **Logic Flow:**
  1. Load `scrapeConfig` from storage.
  2. Auto-scrape fields using predefined selectors.
  3. Fallback to user-driven mapping via click if auto-scrape fails.
- **Example Code:**
```typescript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startScrape') {
    const config = message.config;
    const data = {
      title: document.querySelector(config.titleSelector)?.textContent,
      description: document.querySelector(config.descSelector)?.textContent
    };
    if (!data.title) {
      document.addEventListener('click', (event) => {
        const selectedElement = event.target;
        // Map selected element to a field
      }, { once: true });
    } else {
      sendResponse(data);
    }
  }
});
```

### Autofill Script (`autofill.ts`)
- **Injection Rules:** Matches job board domains, runs at `document_idle`.
- **Logic Flow:**
  1. Retrieve user profile from the background script.
  2. Use `mappings.js` to locate form fields.
  3. Fill fields and dispatch change events.
- **Example Code:**
```typescript
chrome.runtime.sendMessage({ action: 'getProfile' }, (profile) => {
  const mappings = getMappingsForDomain(window.location.hostname);
  Object.entries(mappings).forEach(([field, selector]) => {
    const input = document.querySelector(selector);
    if (input && profile[field]) {
      input.value = profile[field];
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
});
```

---

## 5. Popup & Options UI

### Popup (`popup/index.tsx`)
- **UI Controls:**
  - “Scrape Now” button: Triggers scraping.
  - “Enable/Disable Autofill” toggle: Controls autofill state.
  - “Edit Mappings” link: Opens the options page.
- **State Flow:** Uses `chrome.tabs.sendMessage` to communicate with content scripts.

### Options Page (`options/index.tsx`)
- **Mapping Editor UI:**
  - Lists domains and their selectors.
  - “Test Selector” button validates mappings in real-time.
  - Saves/loads mappings to `chrome.storage.local` or `sync`.

---

## 6. Background / Service Worker

### Responsibilities
- Relays messages between popup, content scripts, and dashboard.
- Manages user profile storage and retrieval.
- Handles bulk intake triggers.

### Example Message Handler
```typescript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'saveProfile') {
    chrome.storage.local.set({ profile: message.profile }, () => {
      sendResponse({ success: true });
    });
  } else if (message.action === 'getProfile') {
    chrome.storage.local.get('profile', (data) => {
      sendResponse(data.profile);
    });
  }
  return true; // Async response
});
```

---

## 7. Storage Schema

### Stored Objects
```json
{
  "profile": {
    "name": "John Doe",
    "email": "john@example.com",
    "resume": "Base64 encoded resume data"
  },
  "scrapeConfig": {
    "linkedin.com": {
      "titleSelector": ".job-title",
      "descSelector": ".job-description"
    },
    "indeed.com": {
      "titleSelector": ".jobTitle",
      "descSelector": ".jobDescriptionText"
    }
  },
  "autofillMappings": {
    "linkedin.com": {
      "name": "input[name='firstName']",
      "email": "input[name='email']"
    }
  }
}
```

### Storage Strategy
- **`chrome.storage.local`:** Used for large, device-specific data (e.g., profiles).
- **`chrome.storage.sync`:** Used for settings synced across devices (e.g., mappings).

---

## 8. Messaging & API Integration

### Message Types
- **Popup to Content Script:** `{ action: 'start