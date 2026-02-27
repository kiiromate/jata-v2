---
alwaysApply: true
---

# Testing and quality rules

## Quality gates
- Keep `pnpm lint` clean
- Keep `pnpm build` working
- Keep `pnpm test` working where tests exist

## Test philosophy
- Test behavior, not implementation
- One concept per test
- Prefer integration tests for business flows

## Pre-change checks
- Before large changes, run the smallest check that proves safety (lint, typecheck, or test)

