# JATA v2 Complete Redesign - Implementation Tasks

## Phase 1: Design System Foundation (2-3 hours)

- [ ] 1. Update Tailwind Configuration


  - Update `apps/web/tailwind.config.js` with JATA color system
  - Add Deep Carbon, Iron Charcoal, Graphite Mist, Silver Ash, Fog White colors
  - Add Lumen Lime, Aural Orange, Cobalt Signal, Rust Neutral accent colors
  - Add light mode color variants
  - Add custom spacing scale (jata-xs through jata-2xl)
  - Add font family definitions (headline, body, data)
  - Add custom height values for app-header and sidebar
  - _Requirements: 1.1-1.8, 2.1-2.7, 6.1-6.7_

- [ ] 2. Update CSS Variables and Global Styles
  - Update `apps/web/src/index.css` with CSS custom properties
  - Import IBM Plex Sans and Space Grotesk fonts from Google Fonts
  - Define dark mode variables (default)
  - Define light mode variables (.light class)
  - Set body font to IBM Plex Sans
  - Set heading fonts to Inter
  - Add .font-data utility class for Space Grotesk
  - _Requirements: 1.1-1.8, 6.1-6.7_

- [ ] 3. Create Design Token Documentation
  - Create `apps/web/docs/DESIGN_TOKENS.md`
  - Document all color tokens with hex values and usage
  - Document spacing scale
  - Document typography scale
  - Document component sizing standards
  - Provide usage examples
  - _Requirements: All_

## Phase 2: Core Layout Components (2-3 hours)

- [ ] 4. Create Sidebar Component
  - [ ] 4.1 Build base Sidebar structure
    - Create `apps/web/src/components/Sidebar.tsx`
    - Define NavItem interface
    - Create navigation items array (Dashboard, Applications, Analytics, Cover Letters, Resume Vault, Extension)
    - Create bottom navigation items array (Settings)
    - Implement collapsed state (60px width, icons only)
    - Implement expanded state (240px width, icons + labels)
    - _Requirements: 3.1, 3.6, 3.7_
  
  - [ ] 4.2 Implement sidebar modes
    - Add mode state: 'collapsed' | 'expanded' | 'hover'
    - Implement expand/collapse toggle button
    - Implement "Expand on Hover" mode with mouse enter/leave events
    - Add 200ms transition animations
    - _Requirements: 3.2, 3.3, 3.4, 3.9_
  
  - [ ] 4.3 Add sidebar styling and interactions
    - Apply Iron Charcoal background
    - Apply Graphite Mist borders
    - Add Lumen Lime accent for active/hover states
    - Add tooltips for icons in collapsed mode
    - Style active route indicator
    - _Requirements: 3.8, 3.10_
  
  - [ ] 4.4 Implement sidebar persistence
    - Save mode preference to localStorage
    - Load mode preference on mount
    - _Requirements: 3.5_

- [ ] 5. Create App Header Component
  - Create `apps/web/src/components/AppHeader.tsx`
  - Set fixed height to 48px
  - Apply Iron Charcoal background
  - Apply Graphite Mist bottom border
  - Add Logo component on left (links to /dashboard)
  - Add Help button (? icon) on right
  - Add Feedback button on right
  - Add User avatar dropdown on far right
  - Add tooltips for icon buttons
  - _Requirements: 4.1-4.9_

- [ ] 6. Create Dashboard Layout Component
  - Create `apps/web/src/components/DashboardLayout.tsx`
  - Combine Sidebar and AppHeader
  - Apply Deep Carbon background to main content
  - Add 24px padding to content area
  - Implement flex layout (sidebar + main area)
  - Ensure content area scrolls independently
  - Adjust content width based on sidebar state
  - _Requirements: 5.1-5.7_

- [ ] 7. Split Header Component
  - Rename current `Header.tsx` to `LandingHeader.tsx`
  - Keep LandingHeader for public pages
  - Use AppHeader for authenticated pages
  - Update imports across the application
  - _Requirements: 4.9_

## Phase 3: Branding and Visual Elements (1-2 hours)

- [ ] 8. Create Logo Component
  - [ ] 8.1 Build SVG Logo component
    - Create `apps/web/src/components/Logo.tsx`
    - Implement stylized "J" shape using SVG path
    - Add accent dot in Lumen Lime
    - Support three sizes: sm (32px), md (48px), lg (64px)
    - Use design tokens for colors
    - Follow 8px modular grid
    - _Requirements: 7.1-7.7_
  
  - [ ] 8.2 Add logo animations
    - Implement optional pulse animation on hover
    - Use Framer Motion for smooth transitions
    - Respect prefers-reduced-motion setting
    - _Requirements: 7.5, 8.7_
  
  - [ ] 8.3 Create favicon assets
    - Export logo as 32x32 favicon.ico
    - Export logo as 192x192 PNG
    - Export logo as 512x512 PNG
    - Update `apps/web/index.html` with favicon links
    - _Requirements: 7.7_

- [ ] 9. Create Loading Animation Component
  - Create `apps/web/src/components/LoadingAnimation.tsx`
  - Implement animated logo with pulse effect
  - Add fade-in transition
  - Use Deep Carbon background
  - Center positioning
  - Respect prefers-reduced-motion
  - _Requirements: 8.1-8.7_

- [ ] 10. Create Help Button Component
  - Create `apps/web/src/components/HelpButton.tsx`
  - Use HelpCircle icon from Lucide
  - Link to /faq
  - Add tooltip "Help & FAQ"
  - Apply hover state with Graphite Mist background
  - _Requirements: 4.4_

## Phase 4: Update Routing and Layouts (1 hour)

- [ ] 11. Update App Routing
  - Update `apps/web/src/App.tsx`
  - Wrap authenticated routes with DashboardLayout
  - Keep public routes with RootLayout
  - Remove Footer from authenticated pages
  - Test all routes render correctly
  - _Requirements: 5.1, 5.4_

- [ ] 12. Update Protected Route Component
  - Ensure ProtectedRoute works with new layout
  - Remove any loading blockers
  - Test authentication flow
  - _Requirements: 5.1_

## Phase 5: Component Style Updates (2-3 hours)

- [ ] 13. Update Button Components
  - Update `apps/web/src/components/ui/button.tsx`
  - Apply new color tokens
  - Use Lumen Lime for primary buttons
  - Use Aural Orange for secondary CTAs
  - Use Cobalt Signal for informational buttons
  - Add proper hover states
  - Ensure 44x44px minimum touch target
  - _Requirements: 2.1-2.7, 10.4_

- [ ] 14. Update Card Components
  - Update card backgrounds to Iron Charcoal
  - Update borders to Graphite Mist
  - Update text colors to Silver Ash / Fog White
  - Add subtle elevation with tonal layering
  - _Requirements: 1.1-1.8_

- [ ] 15. Update Form Components
  - Update input backgrounds to Iron Charcoal
  - Update borders to Graphite Mist
  - Update text colors to Silver Ash
  - Update focus states with Cobalt Signal
  - Update error states with Aural Orange
  - _Requirements: 1.1-1.8, 2.1-2.7_

- [ ] 16. Update Typography Across Pages
  - Update Dashboard page typography
  - Update Analytics page typography
  - Update Settings page typography
  - Update Cover Letter page typography
  - Ensure consistent font usage (IBM Plex Sans for body)
  - Use Space Grotesk for numerical data
  - _Requirements: 6.1-6.7_

- [ ] 17. Update User Dropdown Component
  - Simplify UserDropdown for AppHeader
  - Update styling with new colors
  - Ensure dropdown menu uses Iron Charcoal background
  - Update hover states
  - _Requirements: 4.7_

- [ ] 18. Update Feedback Button Styling
  - Update existing FeedbackButton component
  - Apply new icon button styling
  - Use MessageSquare icon
  - Add tooltip
  - Update modal styling with new colors
  - _Requirements: 4.6_

## Phase 6: Responsive Design (1 hour)

- [ ] 19. Implement Mobile Sidebar
  - Convert Sidebar to drawer on screens < 768px
  - Add hamburger menu button to AppHeader on mobile
  - Implement swipe gestures to open/close drawer
  - Show icons only in mobile sidebar
  - Ensure 44x44px touch targets
  - _Requirements: 10.1-10.7_

- [ ] 20. Test Responsive Layouts
  - Test on mobile viewport (375px)
  - Test on tablet viewport (768px)
  - Test on desktop viewport (1920px)
  - Verify content stacks properly on mobile
  - Verify sidebar drawer works on mobile
  - _Requirements: 10.1-10.7_

## Phase 7: Light Mode Support (1 hour)

- [ ] 21. Implement Light Mode Toggle
  - Ensure ThemeToggle component works with new colors
  - Update theme context to use new color tokens
  - Test theme switching
  - Verify theme persistence
  - _Requirements: 9.1-9.9_

- [ ] 22. Test Light Mode Styling
  - Verify all pages render correctly in light mode
  - Check contrast ratios meet WCAG AA
  - Test accent colors on light backgrounds
  - Verify borders and dividers are visible
  - _Requirements: 9.1-9.9_

## Phase 8: Accessibility Enhancements (1 hour)

- [ ] 23. Add ARIA Labels and Roles
  - Add aria-label to all icon-only buttons
  - Add role="main" to main content area
  - Add aria-current to active navigation items
  - Add aria-expanded to sidebar toggle
  - _Requirements: 12.1-12.8_

- [ ] 24. Implement Keyboard Navigation
  - Test full keyboard navigation (Tab, Enter, Escape)
  - Ensure visible focus indicators on all interactive elements
  - Test sidebar keyboard controls
  - Test modal keyboard controls
  - _Requirements: 12.2, 12.3_

- [ ] 25. Test with Screen Readers
  - Test with NVDA (Windows) or VoiceOver (Mac)
  - Verify all interactive elements are announced
  - Verify navigation structure is clear
  - Fix any accessibility issues found
  - _Requirements: 12.5_

## Phase 9: Performance Optimization (1 hour)

- [ ] 26. Optimize Bundle Size
  - Run bundle analyzer
  - Tree-shake unused Tailwind classes
  - Lazy load routes
  - Code-split large components
  - Optimize font loading (font-display: swap)
  - _Requirements: 11.1-11.8_

- [ ] 27. Optimize Runtime Performance
  - Use CSS transforms for animations
  - Debounce sidebar hover events
  - Memoize expensive computations
  - Use React.memo for static components
  - _Requirements: 11.1-11.8_

- [ ] 28. Run Performance Audits
  - Run Lighthouse audit
  - Verify FCP < 1.8s
  - Verify LCP < 2.5s
  - Verify TTI < 3.8s
  - Verify CLS < 0.1
  - Fix any performance issues
  - _Requirements: 11.1-11.5_

## Phase 10: Testing and Refinement (1-2 hours)

- [ ] 29. Visual QA Testing
  - Test all pages in dark mode
  - Test all pages in light mode
  - Test sidebar collapsed state
  - Test sidebar expanded state
  - Test sidebar hover mode
  - Verify all colors match design system
  - Verify all spacing is consistent
  - _Requirements: All_

- [ ] 30. Cross-Browser Testing
  - Test on Chrome (latest)
  - Test on Firefox (latest)
  - Test on Safari (latest)
  - Test on Edge (latest)
  - Fix any browser-specific issues
  - _Requirements: All_

- [ ] 31. User Flow Testing
  - Test sign in flow
  - Test navigation between pages
  - Test sidebar interactions
  - Test theme switching
  - Test feedback submission
  - Test help button
  - _Requirements: All_

- [ ] 32. Final Polish
  - Review all hover states
  - Review all focus states
  - Review all transitions
  - Fix any visual inconsistencies
  - Remove any debug code
  - Update documentation
  - _Requirements: All_

## Success Criteria

- [ ] All pages use Deep Carbon (#0B0B0C) background
- [ ] Sidebar collapses/expands smoothly with 200ms transitions
- [ ] Sidebar mode persists to localStorage
- [ ] App Header is exactly 48px tall
- [ ] No footer displays on authenticated pages
- [ ] Logo navigates to dashboard when logged in
- [ ] All accent colors used intentionally (Lumen Lime, Aural Orange, Cobalt Signal)
- [ ] Typography is consistent (IBM Plex Sans for body, Inter for headings)
- [ ] Light mode works correctly
- [ ] Responsive design works on mobile
- [ ] Lighthouse score > 90
- [ ] WCAG 2.1 Level AA compliance
- [ ] All animations respect prefers-reduced-motion
- [ ] Bundle size < 500KB gzipped

## Estimated Timeline

- Phase 1: Design System Foundation - 2-3 hours
- Phase 2: Core Layout Components - 2-3 hours
- Phase 3: Branding and Visual Elements - 1-2 hours
- Phase 4: Update Routing and Layouts - 1 hour
- Phase 5: Component Style Updates - 2-3 hours
- Phase 6: Responsive Design - 1 hour
- Phase 7: Light Mode Support - 1 hour
- Phase 8: Accessibility Enhancements - 1 hour
- Phase 9: Performance Optimization - 1 hour
- Phase 10: Testing and Refinement - 1-2 hours

**Total: 12-18 hours**

## Notes

- Tasks should be completed in order as they build on each other
- Test frequently during implementation
- Commit changes after each major task
- Keep the app functional throughout the redesign
- Prioritize core functionality over polish initially
