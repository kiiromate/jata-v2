# JATA V2 - Technical Audit & Gap Analysis

**Date:** 2026-02-27
**Scope:** Web App (`apps/web`) and Browser Extension (`apps/extension`)
**Status:** Incomplete & Inconsistent

## 1. Design System & UI/UX Audit

### 🚨 Critical Design Inconsistencies
The web app fails to consistently apply the "Deep Carbon" and "Lumen Lime" design system defined in `index.css`.

| Component | Issue | Deviation |
|-----------|-------|-----------|
| **Header** (`Header.tsx`) | Uses generic Tailwind `bg-background` instead of `bg-jata-deep-carbon`. | ❌ **High**: Breaks the core app theme. |
| **Charts** (`ApplicationFunnelChart.tsx`) | Uses hardcoded hex values from `chartColors.ts`. | ❌ **Medium**: Ignores semantic tokens (`--chart-1`, etc.). |
| **Stats Cards** (`DashboardStatsCard.tsx`) | Uses `text-blue-600`, `bg-blue-50` (Tailwind defaults). | ❌ **High**: Should use JATA accents (`--jata-accent-blue`). |
| **Global** | `chartColors.ts` redefines a palette entirely separate from CSS variables. | ❌ **Medium**: Creates two sources of truth for color. |

### 📱 Responsiveness
- **Mobile Navigation**: `Header.tsx` has no mobile menu (hamburger) implementation; links will overflow or disappear on small screens.
- **Charts**: `ResponsiveContainer` is used, which is good, but parent containers in `Dashboard.tsx` may not handle resizing gracefully (`grid-cols-1` to `grid-cols-3` logic is basic).

## 2. Extension-Web Integration Gaps

### ⚠️ Functional Breakdowns
1.  **Broken Auto-Extraction**:
    -   `App.tsx` (Extension) sends `autoExtract` message on mount.
    -   `scraper.ts` (Content Script) **does not listen for this message**. It only has `startScraping` logic for interactive selection.
    -   **Impact**: The extension does nothing when opened on a job board unless the user manually clicks "Select Element".

2.  **Auth State Disconnect**:
    -   The extension attempts to use `supabase.auth` directly via `chrome.storage.local`.
    -   **Gap**: There is no mechanism to sync the *web app's* session to the extension. The user must sign in *separately* in the extension, which is poor UX.

3.  **Data Flow**:
    -   The extension saves directly to Supabase (`applications` table).
    -   **Missing**: No immediate feedback in the web app (e.g., a toast "Application Saved") because the web app relies on polling or manual refresh, not real-time subscriptions.

## 3. Web App Functional Gaps

| Feature | Status | Gap |
|---------|--------|-----|
| **Install Page** | ⚠️ Partial | `InstallExtensionPage.tsx` is likely a static link. It does not detect if the extension is *already* installed to change the CTA. |
| **Analytics** | ⚠️ Partial | `ApplicationFunnelChart` is implemented but relies on mocked or potentially mismatched data structures from `dashboardStore`. |
| **Resume Upload** | ❓ Unknown | `ResumeUpload.tsx` exists but needs verification that it links correctly to the AI parsing service. |

## 4. Prioritized Roadmap & Fixes

### Phase 1: Design System Unification (High Priority)
**Goal**: Enforce the "Deep Carbon" theme globally.
1.  [ ] **Refactor `Header.tsx`**: Replace `bg-background` with `bg-jata-deep-carbon` and `text-foreground` with `text-jata-text-primary`.
2.  [ ] **Update `DashboardStatsCard.tsx`**:
    -   Replace `text-blue-600` → `text-jata-accent-blue`
    -   Replace `bg-blue-50` → `bg-jata-accent-blue/10` (using opacity for backgrounds)
3.  [ ] **Delete `chartColors.ts`**: Migrate charts to use CSS variables (`var(--jata-accent-lime)`, etc.) directly.

### Phase 2: Fix Extension Core (Critical)
**Goal**: Make the extension actually scrape automatically.
1.  [ ] **Update `scraper.ts`**: Add a message listener for `autoExtract` that runs the scraping logic immediately without user interaction.
2.  [ ] **Implement Shared Auth**:
    -   (Option A) Use `chrome.cookies` to read the Supabase session cookie from the web app domain.
    -   (Option B - Simpler) Add a "Connect Extension" button in the web app that sends the JWT to the extension via `chrome.runtime.sendMessage`.

### Phase 3: Mobile & Polish (Medium)
1.  [ ] **Mobile Menu**: Add a Radix UI `Sheet` or `DropdownMenu` for mobile navigation in `Header.tsx`.
2.  [ ] **Empty States**: Ensure charts show a friendly "No data yet" state instead of empty axes.

## 5. Success Criteria
- [ ] All 5 major dashboard components use JATA CSS variables (no raw Tailwind colors).
- [ ] Extension successfully extracts job title/company on load (without clicking).
- [ ] Web app header matches the dark theme (Deep Carbon).
- [ ] Mobile view shows a functional hamburger menu.
