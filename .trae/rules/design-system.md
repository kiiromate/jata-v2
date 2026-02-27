---
alwaysApply: true
globs:
  - "apps/web/**/*"
  - "packages/ui/**/*"
---

# JATA design system rules

## Tokens are the source of truth
- Use JATA CSS variables from `apps/web/src/index.css` for design tokens
- Use Tailwind tokenized colors and spacing from `apps/web/tailwind.config.js`
- Avoid raw hex values in components unless you are defining tokens

## Key tokens
- Backgrounds: `--jata-bg-primary`, `--jata-bg-surface`, `--jata-bg-elevated`
- Text: `--jata-text-primary`, `--jata-text-secondary`, `--jata-text-muted`
- Accents: `--jata-accent-lime`, `--jata-accent-orange`, `--jata-accent-blue`, `--jata-accent-rust`
- Spacing: `jata-xs`, `jata-sm`, `jata-md`, `jata-lg`, `jata-xl`, `jata-2xl`
- Layout: `--jata-header-height`, `--jata-sidebar-collapsed`, `--jata-sidebar-expanded`

## UI constraints
- No gradients, glows, or heavy shadows
- Respect `prefers-reduced-motion` for animations
- Keep focus indicators visible on all interactive elements

