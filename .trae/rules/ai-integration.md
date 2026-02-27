---
alwaysApply: true
globs:
  - "apps/web/src/services/**/*"
  - "apps/web/src/lib/**/*"
---

# AI integration rules

## Current AI surface
- Web uses Hugging Face inference APIs via `VITE_HUGGING_FACE_API_KEY`
- Do not add new AI providers without a cost and privacy review

## Privacy
- Do not send full resumes to third-party APIs without explicit user consent
- Mask PII (email, phone) before sending text to any model

## Reliability
- Provide a fallback path when the AI call fails (timeouts, rate limits)
- Cache expensive results when safe

