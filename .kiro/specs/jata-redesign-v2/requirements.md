# JATA v2 Complete Redesign - Requirements

## Introduction

This specification defines the complete visual and functional redesign of JATA, transforming it from a functional MVP into a premium, production-ready application. The redesign is rooted in principles of engineered clarity, functional minimalism, and deliberate contrast, inspired by Supabase's depth, Braun's restraint, and IBM's precision.

## Glossary

- **JATA System**: The complete Job Application Tailoring Assistant platform
- **Deep Carbon**: Primary background color (#0B0B0C) - true black foundation
- **Lumen Lime**: Primary accent color (#C5FF3E) - for success and interactivity
- **Sidebar**: Collapsible navigation panel on the left side of authenticated views
- **App Header**: Minimal top bar (48px) for authenticated users
- **Dashboard Layout**: The main layout wrapper for all authenticated pages
- **Design Token**: CSS custom property defining a design system value

## Design Philosophy

JATA's aesthetic is **engineered clarity**. Every element exists for functional communication. The palette mirrors the logic of precision tools — subtle metallic neutrals with strategic bursts of high-contrast vibrancy to reflect AI precision and user empowerment.

**Core Values**:
- True dark mode (deep black foundation)
- Functional minimalism (Dieter Rams: "Less, but better")
- Tech-intelligent, but not trendy
- Vibrant contrast with deliberate, meaningful accents
- Non-generic (no purples, teals, or neon greens)

## Requirements

### Requirement 1: True Dark Mode Color System

**User Story**: As a user, I want a true dark mode interface that reduces eye strain and feels professional, so that I can work comfortably for extended periods.

#### Acceptance Criteria

1. THE JATA System SHALL use Deep Carbon (#0B0B0C) as the primary background color for all authenticated pages
2. THE JATA System SHALL use Iron Charcoal (#121315) for elevated surfaces and containers
3. THE JATA System SHALL use Graphite Mist (#2A2B2E) for borders, outlines, and hover surfaces
4. THE JATA System SHALL use Silver Ash (#E8E8E8) as the primary text color
5. THE JATA System SHALL use Fog White (#B7B7B7) for secondary text and icons
6. THE JATA System SHALL maintain a minimum contrast ratio of 7:1 for primary text on background
7. THE JATA System SHALL use no gradients or glows in the dark mode interface
8. THE JATA System SHALL implement subtle tonal layering for depth without floating elements

### Requirement 2: Strategic Accent Color System

**User Story**: As a user, I want accent colors that are meaningful and not overwhelming, so that important actions and data stand out clearly.

#### Acceptance Criteria

1. THE JATA System SHALL use Lumen Lime (#C5FF3E) for success states, interactive elements, and performance metrics
2. THE JATA System SHALL use Aural Orange (#FF8736) for alerts and secondary CTAs
3. THE JATA System SHALL use Cobalt Signal (#2271FF) for informational elements, links, and data visualizations
4. THE JATA System SHALL use Rust Neutral (#B45A3D) sparingly for brand personality in marketing sections
5. THE JATA System SHALL use only one dominant accent color per view to avoid visual clutter
6. THE JATA System SHALL apply accent colors with intentionality, not decoration
7. THE JATA System SHALL ensure all accent colors maintain minimum 4.5:1 contrast on dark backgrounds

### Requirement 3: Collapsible Sidebar Navigation

**User Story**: As a user, I want a collapsible sidebar that maximizes screen space while keeping navigation accessible, so that I can focus on my work without distraction.

#### Acceptance Criteria

1. THE Sidebar SHALL default to collapsed state showing only icons (60px width)
2. WHEN a user clicks the expand button, THE Sidebar SHALL expand to show icons with labels (240px width) within 200ms
3. THE Sidebar SHALL support three modes: Collapsed, Expanded, and Expand on Hover
4. WHEN set to "Expand on Hover" mode, THE Sidebar SHALL expand when mouse enters and collapse when mouse leaves
5. THE Sidebar SHALL persist the user's preferred mode to localStorage
6. THE Sidebar SHALL include navigation items: Dashboard, Applications, Analytics, Cover Letters, Resume Vault, Extension, and Settings
7. THE Sidebar SHALL position Settings at the bottom, separated from other items
8. THE Sidebar SHALL use Lumen Lime accent for active/hover states
9. THE Sidebar SHALL animate expand/collapse transitions smoothly over 200ms
10. THE Sidebar SHALL display tooltips for icons when in collapsed mode

### Requirement 4: Minimal App Header

**User Story**: As a user, I want a minimal top bar that doesn't waste vertical space, so that I can see more of my content.

#### Acceptance Criteria

1. THE App Header SHALL have a fixed height of 48px
2. THE App Header SHALL use Iron Charcoal (#121315) as background color
3. THE App Header SHALL display the JATA logo on the left that links to /dashboard
4. THE App Header SHALL display Help button (? icon) linking to /faq on the right
5. THE App Header SHALL display Feedback button (MessageSquare icon) opening feedback modal on the right
6. THE App Header SHALL display User avatar with dropdown menu on the far right
7. THE App Header SHALL show tooltips on hover for icon buttons
8. THE App Header SHALL use Graphite Mist (#2A2B2E) for bottom border
9. THE App Header SHALL NOT display on public pages (landing, signin, signup)

### Requirement 5: Dashboard Layout System

**User Story**: As a user, I want a consistent layout across all authenticated pages, so that navigation and content are predictable.

#### Acceptance Criteria

1. THE Dashboard Layout SHALL combine Sidebar and App Header for all authenticated pages
2. THE Dashboard Layout SHALL apply 24px padding to main content area
3. THE Dashboard Layout SHALL use Deep Carbon (#0B0B0C) as main content background
4. THE Dashboard Layout SHALL NOT display Footer component
5. THE Dashboard Layout SHALL adjust content area width based on sidebar state (collapsed/expanded)
6. THE Dashboard Layout SHALL maintain responsive behavior on mobile (sidebar becomes drawer)
7. THE Dashboard Layout SHALL ensure content area scrolls independently of Sidebar and App Header

### Requirement 6: Typography System

**User Story**: As a user, I want clear, readable typography that conveys professionalism, so that I can easily read and understand content.

#### Acceptance Criteria

1. THE JATA System SHALL use Inter or Satoshi for headlines and UI elements
2. THE JATA System SHALL use IBM Plex Sans for body text
3. THE JATA System SHALL use Space Grotesk for numerical and data displays
4. THE JATA System SHALL apply -1.5% letter spacing (kerning) to the wordmark
5. THE JATA System SHALL maintain line heights between 1.4 and 1.6 for body text
6. THE JATA System SHALL use font weights: 400 (regular), 500 (medium), 600 (semibold)
7. THE JATA System SHALL load fonts efficiently to minimize performance impact

### Requirement 7: Logo and Branding

**User Story**: As a user, I want a distinctive logo that represents the brand's precision and intelligence, so that I can easily identify the application.

#### Acceptance Criteria

1. THE JATA System SHALL display a stylized "J" logo formed by geometric line networks
2. THE Logo SHALL use Silver Ash (#E8E8E8) as primary color on dark backgrounds
3. THE Logo SHALL include an accent dot in Lumen Lime (#C5FF3E)
4. THE Logo SHALL be proportioned using an 8px modular grid system
5. THE Logo SHALL support optional pulse animation on hover
6. THE Logo SHALL be available as SVG for scalability
7. THE Logo SHALL be used as favicon in 32x32, 192x192, and 512x512 sizes
8. THE Wordmark SHALL use lowercase "jata" in Satoshi Medium font

### Requirement 8: Loading States and Animations

**User Story**: As a user, I want smooth loading animations that indicate progress, so that I know the system is working.

#### Acceptance Criteria

1. THE JATA System SHALL display animated logo during initial page load
2. THE Loading Animation SHALL use line connection pattern converging to form "J" shape
3. THE Loading Animation SHALL transition from Lumen Lime to Silver Ash upon completion
4. THE JATA System SHALL use skeleton screens for content loading states
5. THE JATA System SHALL animate transitions between pages over 200ms
6. THE JATA System SHALL use subtle pulse animation for active/loading indicators
7. THE JATA System SHALL respect user's prefers-reduced-motion setting

### Requirement 9: Light Mode Support

**User Story**: As a user, I want a light mode option for bright environments, so that I can use the app comfortably in any lighting condition.

#### Acceptance Criteria

1. THE JATA System SHALL support light mode with #FFFFFF background
2. THE Light Mode SHALL use #F5F6F7 for elevated surfaces
3. THE Light Mode SHALL use #101010 for primary text
4. THE Light Mode SHALL use #5A5A5A for secondary text
5. THE Light Mode SHALL use #E2E2E2 for dividers and borders
6. THE Light Mode SHALL maintain the same accent colors (Lumen Lime, Aural Orange, Cobalt Signal)
7. THE Light Mode SHALL feel like a productivity suite (crisp, analytical)
8. THE JATA System SHALL allow users to toggle between light and dark modes
9. THE JATA System SHALL persist theme preference across sessions

### Requirement 10: Responsive Design

**User Story**: As a user, I want the application to work well on mobile devices, so that I can manage applications on the go.

#### Acceptance Criteria

1. THE JATA System SHALL transform Sidebar into a drawer menu on screens < 768px
2. THE App Header SHALL remain at 48px height on all screen sizes
3. THE JATA System SHALL stack content vertically on mobile devices
4. THE JATA System SHALL ensure touch targets are minimum 44x44px
5. THE JATA System SHALL hide text labels in mobile sidebar (icons only)
6. THE JATA System SHALL support swipe gestures to open/close mobile drawer
7. THE JATA System SHALL maintain readability at all viewport sizes

### Requirement 11: Performance and Optimization

**User Story**: As a user, I want the application to load quickly and run smoothly, so that I can work efficiently without delays.

#### Acceptance Criteria

1. THE JATA System SHALL achieve First Contentful Paint (FCP) < 1.8s
2. THE JATA System SHALL achieve Largest Contentful Paint (LCP) < 2.5s
3. THE JATA System SHALL achieve Time to Interactive (TTI) < 3.8s
4. THE JATA System SHALL achieve Cumulative Layout Shift (CLS) < 0.1
5. THE JATA System SHALL lazy load fonts to prevent render blocking
6. THE JATA System SHALL code-split routes for faster initial load
7. THE JATA System SHALL optimize images using WebP format where supported
8. THE JATA System SHALL minimize CSS bundle size using PurgeCSS

### Requirement 12: Accessibility Compliance

**User Story**: As a user with accessibility needs, I want the application to be fully accessible, so that I can use all features regardless of ability.

#### Acceptance Criteria

1. THE JATA System SHALL meet WCAG 2.1 Level AA standards
2. THE JATA System SHALL support full keyboard navigation
3. THE JATA System SHALL provide visible focus indicators on all interactive elements
4. THE JATA System SHALL include ARIA labels for icon-only buttons
5. THE JATA System SHALL support screen readers with semantic HTML
6. THE JATA System SHALL provide skip navigation link for keyboard users
7. THE JATA System SHALL ensure all animations respect prefers-reduced-motion
8. THE JATA System SHALL maintain minimum 4.5:1 contrast for normal text

## Design Tokens

### Color Tokens (Dark Mode)
```css
--jata-bg-primary: #0B0B0C;      /* Deep Carbon */
--jata-bg-surface: #121315;      /* Iron Charcoal */
--jata-bg-elevated: #1A1A1C;     /* Elevated surfaces */
--jata-border: #2A2B2E;          /* Graphite Mist */
--jata-text-primary: #E8E8E8;    /* Silver Ash */
--jata-text-secondary: #B7B7B7;  /* Fog White */
--jata-text-muted: #7F8A8E;      /* Muted Cyan-Gray */

--jata-accent-lime: #C5FF3E;     /* Lumen Lime */
--jata-accent-orange: #FF8736;   /* Aural Orange */
--jata-accent-blue: #2271FF;     /* Cobalt Signal */
--jata-accent-rust: #B45A3D;     /* Rust Neutral */
```

### Spacing Scale
```css
--jata-space-xs: 8px;
--jata-space-sm: 16px;
--jata-space-md: 24px;
--jata-space-lg: 32px;
--jata-space-xl: 48px;
--jata-space-2xl: 64px;
```

### Typography Scale
```css
--jata-font-headline: 'Inter', 'Satoshi', sans-serif;
--jata-font-body: 'IBM Plex Sans', sans-serif;
--jata-font-data: 'Space Grotesk', monospace;

--jata-text-xs: 12px;
--jata-text-sm: 14px;
--jata-text-base: 16px;
--jata-text-lg: 18px;
--jata-text-xl: 20px;
--jata-text-2xl: 24px;
--jata-text-3xl: 30px;
--jata-text-4xl: 36px;
```

## Success Criteria

The redesign will be considered successful when:

1. ✅ All pages use true dark mode with Deep Carbon background
2. ✅ Sidebar collapses/expands smoothly with user preference persistence
3. ✅ App Header is 48px and contains only essential elements
4. ✅ No footer displays on authenticated pages
5. ✅ All accent colors are used intentionally and meaningfully
6. ✅ Typography is clear, professional, and consistent
7. ✅ Logo is distinctive and represents brand values
8. ✅ Loading states are smooth and informative
9. ✅ Light mode is available and well-designed
10. ✅ Application is fully responsive on mobile
11. ✅ Performance metrics meet targets (LCP < 2.5s)
12. ✅ WCAG 2.1 Level AA compliance achieved

## Out of Scope

The following are explicitly out of scope for this redesign:

- Backend API changes
- Database schema modifications
- New feature development (focus is on redesign of existing features)
- Third-party integrations
- Marketing website (separate from app)
- Email templates
- Mobile native apps

## Dependencies

- Tailwind CSS v3.x
- React 18.x
- Framer Motion (for animations)
- Lucide React (for icons)
- Inter, IBM Plex Sans, Space Grotesk fonts (Google Fonts)

## Timeline

- **Phase 1**: Design System Implementation (2-3 hours)
- **Phase 2**: Layout System (Sidebar + App Header) (2-3 hours)
- **Phase 3**: Component Updates (2-3 hours)
- **Phase 4**: Logo and Branding (1-2 hours)
- **Phase 5**: Testing and Refinement (1-2 hours)

**Total Estimated Time**: 8-13 hours
