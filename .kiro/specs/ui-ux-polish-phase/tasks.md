# Implementation Plan

- [x] 1. Enhance Theme System with System Detection and Smooth Transitions





  - Update `ThemeProvider.tsx` to improve system theme detection using `window.matchMedia`
  - Add event listener for system theme changes that updates theme in real-time
  - Implement CSS transition classes for smooth theme switching (300ms duration)
  - Add `resolvedTheme` and `systemTheme` to context value for better theme state management
  - Create `ThemeToggle` component with dropdown for Light/Dark/System options
  - Add theme toggle to Header component
  - Test theme persistence across browser sessions and page refreshes
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Optimize Visual Density and Spacing Across All Pages





  - Define consistent spacing scale in `tailwind.config.js` (xs: 8px, sm: 16px, md: 24px, lg: 32px, xl: 48px)
  - Audit Dashboard page and reduce excessive whitespace by adding content cards
  - Add welcome card with quick actions to Dashboard
  - Enhance Analytics page layout with compact data summary cards
  - Update all page layouts to use consistent spacing values from the scale
  - Add relevant visual elements (icons, illustrations) to sparse pages
  - Ensure line-height values are between 1.4-1.6 for optimal readability
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Improve Navigation Icons and Add Text Labels





  - Create `NavItem` interface with label, icon, path, tooltip, and badge properties
  - Refactor `IconNav.tsx` to use new NavItem structure with text labels
  - Add responsive text labels (visible on desktop, hidden on mobile)
  - Replace universally recognized icons for better clarity (keep LayoutDashboard, BarChart2, FileText, Puzzle)
  - Enhance `Tooltip.tsx` component with configurable delay (default 300ms) and smart positioning
  - Improve active state styling with subtle background color instead of just hover
  - Remove pulse animation from extension button and replace with subtle "New" badge
  - Add smooth hover transitions (100ms) to all navigation items
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Implement Feedback System




  - [x] 4.1 Create Supabase feedback table with migration


    - Write SQL migration to create `feedback` table with columns: id, user_id, type, message, page, user_agent, status, created_at, updated_at
    - Add Row Level Security policies for user access
    - Create indexes on user_id and status columns
    - _Requirements: 5.1, 5.3_
  - [x] 4.2 Create FeedbackButton and FeedbackDialog components


    - Create `FeedbackButton.tsx` component with icon variant for navigation
    - Create `FeedbackDialog.tsx` modal component with form fields (type, message)
    - Implement form validation (message min 10 chars, max 1000 chars)
    - Add category selection dropdown (Bug, Feature Request, Improvement, Other)
    - Auto-capture current page URL and user agent
    - _Requirements: 5.1, 5.2_
  - [x] 4.3 Implement feedback submission logic


    - Create `feedbackService.ts` with submitFeedback function
    - Integrate with Supabase to store feedback data
    - Add success toast notification on successful submission
    - Add error toast with retry option on failure
    - Implement error logging to Sentry
    - _Requirements: 5.3, 5.4, 5.5_
  - [x] 4.4 Integrate FeedbackButton into IconNav


    - Replace non-functional feedback button in `IconNav.tsx` with new FeedbackButton component
    - Ensure feedback button works from all pages
    - Test feedback submission flow end-to-end
    - _Requirements: 5.1, 5.4, 5.5_

- [x] 5. Fix Extension Installation Flow




  - [x] 5.1 Create ExtensionInstaller service


    - Create `extensionInstaller.ts` service with browser detection logic
    - Implement download functionality with progress tracking
    - Add error handling for download failures
    - _Requirements: 6.1, 6.2, 6.4_
  - [x] 5.2 Enhance InstallExtensionPage component


    - Add browser detection and display browser-specific instructions
    - Implement download button with loading state and progress indicator
    - Replace placeholder images with actual screenshots or instructional GIFs
    - Add collapsible troubleshooting section with common issues
    - Add success verification checklist
    - Fix infinite loading issue by properly handling download completion
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  - [x] 5.3 Test extension installation across browsers


    - Test download and installation flow on Chrome
    - Test download and installation flow on Firefox
    - Test download and installation flow on Edge
    - Verify manual installation instructions are clear and accurate
    - _Requirements: 6.4, 6.5_

- [x] 6. Enhance Settings Page and Persistence




  - [x] 6.1 Create SettingsManager service


    - Create `settingsManager.ts` service for centralized settings management
    - Implement loadSettings function to fetch from Supabase user_metadata
    - Implement saveSettings function with debouncing (500ms)
    - Add validation logic for all setting types
    - Implement fallback to localStorage for offline access
    - _Requirements: 7.1, 7.2, 7.3_
  - [x] 6.2 Update Settings page UI


    - Add theme selector section with preview
    - Add notification preferences section (email, push, application updates)
    - Add privacy controls section (analytics, error reporting)
    - Add save status indicators for each section
    - Implement "Unsaved changes" warning when navigating away
    - Add "Reset to Defaults" button with confirmation dialog
    - Improve error messages with specific guidance
    - _Requirements: 7.2, 7.4, 7.5_
  - [x] 6.3 Implement settings persistence


    - Integrate SettingsManager service with Settings page
    - Implement optimistic updates with rollback on error
    - Add success toast notifications on save
    - Test settings persistence across browser sessions
    - _Requirements: 7.1, 7.3, 7.5_

- [x] 7. Create FAQ Page





  - [x] 7.1 Create FAQ data structure and content


    - Define FAQItem interface with id, category, question, answer, tags
    - Create FAQ content with at least 15 questions across 6 categories
    - Categories: Getting Started, Features & Usage, AI & Privacy, Extension, Troubleshooting, Account & Billing
    - _Requirements: 8.2, 8.4_

  - [x] 7.2 Build FAQ page component

    - Create `FAQPage.tsx` with search functionality
    - Implement category filtering with tabs or sidebar
    - Create expandable accordion items for questions
    - Add smooth scroll to question when expanded
    - Implement fuzzy search that filters questions in real-time (< 300ms)
    - Add "Was this helpful?" feedback buttons for each answer
    - _Requirements: 8.1, 8.3, 8.4, 8.5_

  - [x] 7.3 Add FAQ route and navigation

    - Add FAQ route to App.tsx
    - Add FAQ link to footer
    - Add FAQ link to Contact page as self-service option
    - _Requirements: 8.1_

- [x] 8. Create Contact Page




  - [x] 8.1 Create Supabase contact_submissions table


    - Write SQL migration for contact_submissions table
    - Add columns: id, name, email, subject, message, category, status, created_at
    - Add Row Level Security policy allowing public inserts
    - Create index on status column
    - _Requirements: 9.5_
  - [x] 8.2 Build Contact page component


    - Create `ContactPage.tsx` with contact form
    - Add form fields: name, email, subject, message, category dropdown
    - Display email address for direct contact
    - Add expected response time indicator (e.g., "We typically respond within 72 hours")
    - Add links to FAQ and documentation
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 8.3 Implement contact form submission

    - Create `contactService.ts` with submitContact function
    - Implement form validation (name min 2 chars, valid email, message min 20 chars)
    - Submit to Supabase contact_submissions table
    - Add success toast notification
    - Add error handling with clear error messages
    - Implement rate limiting (client-side: 3 submissions per hour)
    - _Requirements: 9.5_


  - [x] 8.4 Add Contact route and navigation





    - Add Contact route to App.tsx
    - Add Contact link to footer
    - Add Contact link to main navigation or user dropdown
    - _Requirements: 9.1_
-

- [x] 9. Create Privacy Policy Page





  - [x] 9.1 Write Privacy Policy content



    - Write comprehensive privacy policy covering: data collection, usage, storage, third-party services
    - Include sections on AI data processing, Supabase storage, Hugging Face integration (Do not divulge any critical informmation on our infrastucture and the tehnology used)
    - Add information about user rights and choices
    - Include cookie policy section
    - Add contact information for privacy inquiries
    - _Requirements: 10.1, 10.3_
  - [x] 9.2 Build Privacy Policy page component



    - Create `PrivacyPolicyPage.tsx` with formatted content
    - Add table of contents with anchor links
    - Display "Last Updated" date prominently at top
    - Implement print-friendly layout
    - Add "Download as PDF" option (optional)
    - _Requirements: 10.1, 10.5_
  - [x] 9.3 Add Privacy Policy route and links



    - Add Privacy Policy route to App.tsx
    - Add Privacy Policy link to footer
    - Link from signup/signin pages
    - _Requirements: 10.4_

- [x] 10. Create Terms of Service Page





  - [x] 10.1 Write Terms of Service content


    - Write comprehensive terms covering: acceptance, service description, user responsibilities
    - Include sections on intellectual property, liability limitations, termination, governing law
    - Add section on changes to terms
    - Include effective date and version information
    - _Requirements: 10.2_
  - [x] 10.2 Build Terms of Service page component



    - Create `TermsOfServicePage.tsx` with formatted content
    - Add table of contents with anchor links
    - Display effective date prominently
    - Implement print-friendly layout
    - Add version history section (optional)
    - _Requirements: 10.2, 10.5_

  - [x] 10.3 Add Terms of Service route and links


    - Add Terms of Service route to App.tsx
    - Add Terms of Service link to footer
    - Link from signup/signin pages
    - _Requirements: 10.4_

- [x] 11. Create Footer Component



  - Create `Footer.tsx` component with three sections: Product, Support, Legal
  - Add links to Dashboard, Analytics, Extension under Product
  - Add links to FAQ, Contact, Documentation under Support
  - Add links to Privacy Policy, Terms of Service under Legal
  - Add copyright notice with current year
  - Implement responsive layout (stacked on mobile, columns on desktop)
  - Add Footer to RootLayout or AppLayout component
  - Style footer to match overall design system
  - _Requirements: 10.4_


- [x] 12. Implement Action Discoverability Improvements


  - Audit all primary action buttons across the application
  - Update button labels to be more descriptive (e.g., "Save Changes" instead of "Save")
  - Implement consistent button styling using shadcn/ui Button variants (primary, secondary, destructive)
  - Add hover states with visual feedback (color change, elevation) with 100ms transition
  - Add contextual tooltips for actions that may not be immediately clear
  - Implement disabled state styling with explanatory text
  - Add loading states to all async action buttons
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 13. Add Accessibility Enhancements




  - Add ARIA labels to all icon buttons and navigation items
  - Implement skip navigation link for keyboard users
  - Ensure all interactive elements are keyboard accessible
  - Add focus indicators to all focusable elements
  - Verify color contrast ratios meet WCAG 2.1 Level AA (4.5:1 for normal text)
  - Add aria-live regions for dynamic content updates (toasts, loading states)
  - Test with screen reader (NVDA or JAWS on Windows)
  - _Requirements: 3.4, 4.2, 8.1, 9.1_

- [ ] 14. Write Integration Tests

  - Write integration test for theme switching across pages
  - Write integration test for settings persistence across sessions
  - Write integration test for feedback submission flow
  - Write integration test for contact form submission
  - Write integration test for FAQ search functionality
  - _Requirements: All_

- [ ] 15. Perform Manual QA Testing

  - Test theme system on Windows, macOS, and Linux
  - Test all navigation flows and verify tooltips
  - Test feedback submission from multiple pages
  - Test extension installation on Chrome, Firefox, and Edge
  - Test settings persistence and validation
  - Test FAQ search and filtering
  - Test contact form submission
  - Verify all legal pages are accessible and properly formatted
  - Test responsive layouts on mobile, tablet, and desktop
  - Perform accessibility audit with axe DevTools
  - _Requirements: All_
