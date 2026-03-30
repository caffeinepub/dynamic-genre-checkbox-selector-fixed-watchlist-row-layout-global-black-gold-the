# Rebaseline from Live Deployment

## Overview
This document records the rebaseline process performed to align the frontend codebase with the currently deployed live version, removing any layout/styling corruption introduced by draft builds.

## Date
February 6, 2026

## Rebaseline Process

### Files Verified Against Live Deployment
The following frontend files were verified to match the live deployment's layout and behavior:

1. **frontend/src/components/layout/AppLayout.tsx**
   - Collapsible sticky header with ChevronUp/ChevronDown toggle
   - Logo reference: `/assets/generated/app-logo.dim_512x512.png`
   - Smooth collapse/expand transitions
   - Footer with caffeine.ai attribution

2. **frontend/src/components/manga/MangaListPage.tsx**
   - Container sizing and row alignment
   - Overflow behavior (horizontal scroll for wide rows)
   - Uniform watchlist row width with 925px minimum
   - Sticky floating controls panel
   - Loading/error states with proper backend connection handling

3. **frontend/src/components/manga/AddMangaDialog.tsx**
   - Fixed header with action buttons
   - Independently scrollable body (400px max-height)
   - Deterministic scroll container with overscroll containment
   - Auto-pruning of invalid genre selections

4. **frontend/src/index.css**
   - Global CSS utilities including `.add-manga-dialog-scroll-body`
   - Rainbow border animation for manga card hover effects
   - OKLCH color system with warm sepia/ink palette
   - Scrollbar styling and hidden scrollbar utilities

### Assets Verified
- **frontend/public/assets/generated/app-logo.dim_512x512.png** - Application logo
- **frontend/public/assets/generated/cover-placeholder.dim_600x900.png** - Cover placeholder image

### Explicit Rules
1. **Do NOT merge code from known-corrupted draft versions** (versions 44-45 had layout corruption)
2. **Always verify layout against live deployment** before accepting changes
3. **Test header collapse/expand behavior** on every build
4. **Verify AddMangaDialog scroll behavior** remains deterministic
5. **Check MangaListPage row alignment** across different viewport sizes

## Verification Checklist
Before deploying any future changes, verify:
- [ ] Header collapses/expands smoothly without layout jumps
- [ ] Logo and title are visible in expanded state
- [ ] Login/Logout button is accessible in expanded state
- [ ] Collapse toggle button is always visible and centered when collapsed
- [ ] MangaListPage rows align correctly (left/center/right options work)
- [ ] AddMangaDialog has fixed header and scrollable body
- [ ] No horizontal overflow on main page container
- [ ] Footer is properly positioned at bottom

## Notes
This rebaseline was performed in response to user feedback that previous draft versions had corrupted the layout. The live deployment (version prior to draft 44) was used as the source of truth for correct layout behavior.
