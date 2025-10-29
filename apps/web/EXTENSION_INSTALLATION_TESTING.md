# Extension Installation Testing Guide

This document provides a comprehensive testing checklist for the JATA extension installation flow across different browsers.

## Prerequisites

1. Build the extension:
   ```bash
   cd apps/extension
   pnpm build
   ```

2. Build the web app:
   ```bash
   cd apps/web
   pnpm build
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

## Testing Checklist

### Chrome Testing

#### Browser Detection
- [ ] Open the Install Extension page in Chrome
- [ ] Verify that "Google Chrome" is detected and displayed
- [ ] Verify that the Chrome version number is shown
- [ ] Verify that the browser is marked as compatible

#### Download Flow
- [ ] Click the "Download Extension" button
- [ ] Verify that the download starts (check Downloads folder)
- [ ] Verify that the button shows "Downloading..." with a spinner
- [ ] Verify that progress percentage is displayed (if available)
- [ ] Verify that the button changes to "Download Complete" with a checkmark
- [ ] Verify that a success toast notification appears
- [ ] Verify that an alert message appears with extraction instructions

#### Installation Instructions
- [ ] Verify that Chrome-specific instructions are displayed
- [ ] Verify that all 5 steps are shown clearly
- [ ] Verify that the `chrome://extensions` URL is displayed in a code block
- [ ] Click the copy button next to the URL and verify it copies to clipboard
- [ ] Verify that a "Copied!" toast appears

#### Manual Installation
- [ ] Extract the downloaded zip file
- [ ] Navigate to `chrome://extensions`
- [ ] Enable Developer mode
- [ ] Click "Load unpacked"
- [ ] Select the extracted extension folder
- [ ] Verify that the extension installs without errors
- [ ] Verify that the JATA icon appears in the toolbar

#### Verification Checklist
- [ ] Verify that all 4 verification items are displayed
- [ ] Test each verification item:
  - [ ] Extension appears in extension list
  - [ ] JATA icon is visible in toolbar
  - [ ] Clicking icon opens popup
  - [ ] Can capture job descriptions

#### Troubleshooting Section
- [ ] Click on "Troubleshooting Common Issues" collapsible
- [ ] Verify that it expands smoothly
- [ ] Verify that Chrome-specific troubleshooting tips are shown
- [ ] Verify that at least 4-5 common issues are listed
- [ ] Click again to collapse and verify smooth animation

#### Additional Help
- [ ] Verify that "Need More Help?" section is visible
- [ ] Click "View FAQ" button and verify it navigates correctly
- [ ] Click "Contact Support" button and verify it navigates correctly

### Edge Testing

#### Browser Detection
- [ ] Open the Install Extension page in Edge
- [ ] Verify that "Microsoft Edge" is detected and displayed
- [ ] Verify that the Edge version number is shown
- [ ] Verify that the browser is marked as compatible

#### Download Flow
- [ ] Repeat all download flow tests from Chrome section
- [ ] Verify Edge-specific behavior (if any)

#### Installation Instructions
- [ ] Verify that Edge-specific instructions are displayed
- [ ] Verify that the `edge://extensions` URL is displayed
- [ ] Verify that Developer mode toggle location is mentioned (bottom-left)
- [ ] Follow all 5 steps to install the extension

#### Manual Installation
- [ ] Extract the downloaded zip file
- [ ] Navigate to `edge://extensions`
- [ ] Enable Developer mode (bottom-left corner)
- [ ] Click "Load unpacked"
- [ ] Select the extracted extension folder
- [ ] Verify that the extension installs without errors
- [ ] Verify that the JATA icon appears in the toolbar

#### Verification & Troubleshooting
- [ ] Repeat all verification tests from Chrome section
- [ ] Verify Edge-specific troubleshooting tips are shown

### Firefox Testing

#### Browser Detection
- [ ] Open the Install Extension page in Firefox
- [ ] Verify that "Mozilla Firefox" is detected and displayed
- [ ] Verify that the Firefox version number is shown
- [ ] Verify that the browser is marked as compatible

#### Download Flow
- [ ] Repeat all download flow tests from Chrome section

#### Installation Instructions
- [ ] Verify that Firefox-specific instructions are displayed
- [ ] Verify that the `about:debugging#/runtime/this-firefox` URL is displayed
- [ ] Note that Firefox uses "Load Temporary Add-on" instead of "Load unpacked"
- [ ] Verify that the temporary installation warning is shown

#### Manual Installation
- [ ] Extract the downloaded zip file
- [ ] Navigate to `about:debugging#/runtime/this-firefox`
- [ ] Click "Load Temporary Add-on..."
- [ ] Navigate to the extracted folder and select `manifest.json`
- [ ] Verify that the extension installs without errors
- [ ] Verify that the JATA icon appears in the toolbar
- [ ] **Important**: Note that the extension will be removed when Firefox closes

#### Verification & Troubleshooting
- [ ] Repeat all verification tests from Chrome section
- [ ] Verify Firefox-specific troubleshooting tips are shown
- [ ] Verify that the temporary installation warning is clear

### Opera Testing (Optional)

#### Browser Detection
- [ ] Open the Install Extension page in Opera
- [ ] Verify that "Opera" is detected and displayed
- [ ] Verify that the browser is marked as compatible

#### Installation
- [ ] Follow similar steps as Chrome (Opera uses Chromium engine)
- [ ] Navigate to `opera://extensions`
- [ ] Verify installation works correctly

### Safari Testing

#### Browser Detection
- [ ] Open the Install Extension page in Safari
- [ ] Verify that "Safari" is detected and displayed
- [ ] Verify that the browser is marked as **NOT compatible**
- [ ] Verify that a warning alert is displayed
- [ ] Verify that installation instructions suggest using a different browser

### Unknown Browser Testing

#### Browser Detection
- [ ] Open the page in an uncommon browser (if available)
- [ ] Verify that "Unknown Browser" is detected
- [ ] Verify that the browser is marked as NOT compatible
- [ ] Verify that appropriate warning is displayed

## Error Handling Tests

### Download Errors
- [ ] Simulate network failure during download
- [ ] Verify that error toast appears
- [ ] Verify that error alert is displayed with retry option
- [ ] Verify that the download button returns to initial state

### Installation Errors
- [ ] Try to install without extracting the zip file
- [ ] Verify that browser shows appropriate error
- [ ] Check that troubleshooting section addresses this issue

### Permission Errors
- [ ] Try to install from a restricted location (e.g., Program Files)
- [ ] Verify that appropriate error is shown
- [ ] Check that troubleshooting section addresses this issue

## Responsive Design Tests

### Desktop (1920x1080)
- [ ] Verify layout looks good on large screens
- [ ] Verify that content is centered and not too wide
- [ ] Verify that buttons are appropriately sized

### Tablet (768x1024)
- [ ] Verify layout adapts correctly
- [ ] Verify that buttons stack appropriately
- [ ] Verify that instructions remain readable

### Mobile (375x667)
- [ ] Verify layout is mobile-friendly
- [ ] Verify that buttons are full-width on mobile
- [ ] Verify that text is readable without zooming
- [ ] Verify that collapsible sections work on touch

## Accessibility Tests

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Verify that focus indicators are visible
- [ ] Verify that Enter/Space activates buttons
- [ ] Verify that collapsible can be toggled with keyboard

### Screen Reader
- [ ] Test with NVDA or JAWS (Windows)
- [ ] Verify that all content is announced correctly
- [ ] Verify that button states are announced
- [ ] Verify that alerts are announced

### Color Contrast
- [ ] Verify that all text meets WCAG AA standards (4.5:1)
- [ ] Test in both light and dark modes
- [ ] Verify that icons have sufficient contrast

## Performance Tests

### Load Time
- [ ] Measure page load time (should be < 2 seconds)
- [ ] Verify that browser detection happens immediately
- [ ] Verify that no layout shift occurs during load

### Download Performance
- [ ] Test download with slow network (throttle to 3G)
- [ ] Verify that progress indicator updates smoothly
- [ ] Verify that download completes successfully

## Cross-Browser Compatibility Summary

| Feature | Chrome | Edge | Firefox | Opera | Safari |
|---------|--------|------|---------|-------|--------|
| Browser Detection | ✓ | ✓ | ✓ | ✓ | ✓ |
| Download Flow | ✓ | ✓ | ✓ | ✓ | N/A |
| Installation | ✓ | ✓ | ✓ (Temp) | ✓ | ✗ |
| Troubleshooting | ✓ | ✓ | ✓ | ✓ | N/A |

## Known Issues

Document any issues found during testing:

1. **Issue**: [Description]
   - **Browser**: [Browser name and version]
   - **Steps to Reproduce**: [Steps]
   - **Expected**: [Expected behavior]
   - **Actual**: [Actual behavior]
   - **Severity**: [Low/Medium/High]

## Sign-off

- [ ] All Chrome tests passed
- [ ] All Edge tests passed
- [ ] All Firefox tests passed
- [ ] Opera tests passed (optional)
- [ ] Safari compatibility warning works
- [ ] Error handling works correctly
- [ ] Responsive design works on all screen sizes
- [ ] Accessibility requirements met
- [ ] Performance is acceptable

**Tested by**: _______________
**Date**: _______________
**Notes**: _______________
