---
alwaysApply: true
globs:
  - "apps/extension/**/*"
---

# Browser extension rules

## Manifest and permissions
- Use Manifest V3 patterns only
- Request the minimal permissions set
- Content scripts must target specific domains, not broad wildcards

## Code organization
- Content scripts: `apps/extension/src/contentScripts/*` for DOM interaction only
- Background service worker: `apps/extension/src/background.ts` for API calls and storage
- Shared extension logic: `apps/extension/src/lib/*`

## Security
- Never expose secrets in content scripts
- Treat content scripts as untrusted inputs; validate messages in the background

