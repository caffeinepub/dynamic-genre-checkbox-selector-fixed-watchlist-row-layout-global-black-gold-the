# Add Manga Dialog Layout Regression Checklist

This checklist verifies that the Add Manga dialog remains accessible and scrollable on all viewport sizes, especially small laptop and mobile screens.

## Test Scenarios

### 1. Small Laptop Viewport (~700px height)
- [ ] Resize browser window to approximately 1366x700 (common laptop resolution)
- [ ] Open the Add Manga dialog
- [ ] Verify the dialog does not extend beyond the visible screen area
- [ ] Verify the dialog header (title + description + alerts) is visible at the top
- [ ] Verify the dialog footer (Cancel + Add Manga buttons) is visible at the bottom
- [ ] Scroll the dialog body using mouse wheel
- [ ] Verify all form fields (Alternate Titles, Synopsis, Genres, Cover Images, Chapters, Rating, Bookmarks, Notes) are reachable via scrolling
- [ ] Click the "Add Manga" button to confirm it is clickable (no overlays blocking it)
- [ ] Verify the page behind the modal does NOT scroll when scrolling inside the dialog

### 2. Mobile Viewport (375x667 - iPhone SE)
- [ ] Resize browser to 375x667 or use browser DevTools mobile emulation
- [ ] Open the Add Manga dialog
- [ ] Verify the dialog fills the viewport height appropriately (100dvh on mobile)
- [ ] Verify the header and footer are visible
- [ ] Scroll the dialog body using touch/trackpad gestures
- [ ] Verify all form fields are reachable
- [ ] Tap the "Add Manga" button to confirm it is tappable
- [ ] Verify no horizontal scrolling is required

### 3. Tablet Viewport (768x1024 - iPad)
- [ ] Resize browser to 768x1024 or use browser DevTools tablet emulation
- [ ] Open the Add Manga dialog
- [ ] Verify the dialog is properly constrained (90dvh on larger screens)
- [ ] Verify scrolling works smoothly
- [ ] Verify buttons are accessible

### 4. Edge Cases
- [ ] Open dialog, scroll to bottom, verify "Add Manga" button is visible and clickable
- [ ] Open dialog, scroll to middle, verify both header and footer remain in their positions
- [ ] Fill out a long synopsis (multiple paragraphs), verify scrolling still works
- [ ] Add 4 alternate titles, verify layout does not break
- [ ] Upload multiple cover images, verify scrolling accommodates the preview grid

## Expected Behavior
- Dialog height is constrained to viewport using `100dvh` (mobile) or `90dvh` (desktop)
- Dialog uses flex layout with `flex-col` and `min-h-0` to enable proper scrolling
- Header (with alerts) is fixed at top with `shrink-0`
- Body (ScrollArea) is scrollable with `flex-1 min-h-0`
- Footer (action buttons) is fixed at bottom with `shrink-0` and `border-t`
- No part of the dialog extends beyond the viewport
- Page behind the modal does not scroll when interacting with the dialog
- All interactive elements (inputs, buttons) are reachable and clickable

## Failure Indicators
- ❌ "Add Manga" button is not visible or not clickable
- ❌ Dialog extends beyond viewport, requiring page scroll to reach buttons
- ❌ ScrollArea does not scroll or scrolls the page instead of the dialog body
- ❌ Buttons are overlaid by other elements or have `pointer-events: none`
- ❌ Horizontal scrolling is required on mobile

## Notes
- This checklist should be run after any changes to `AddMangaDialog.tsx` or related UI components
- Use browser DevTools to simulate different viewport sizes accurately
- Test on actual mobile devices when possible for touch interaction verification
