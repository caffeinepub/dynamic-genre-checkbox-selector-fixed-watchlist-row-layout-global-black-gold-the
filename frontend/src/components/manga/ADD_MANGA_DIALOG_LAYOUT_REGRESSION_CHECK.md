# Add Manga Dialog Layout Regression Checklist

This checklist verifies that the Add Manga dialog remains accessible and scrollable on all viewport sizes, especially small laptop and mobile screens.

## Test Scenarios

### 1. Small Laptop Viewport (~700px height)
- [ ] Resize browser window to approximately 1366x700 (common laptop resolution)
- [ ] Open the Add Manga dialog
- [ ] Verify the dialog does not extend beyond the visible screen area
- [ ] Verify the dialog header (title + action buttons) is visible at the top and stays fixed
- [ ] Scroll the dialog body using mouse wheel
- [ ] Verify the scrollable body area has a max-height of 400px (enforced via inline style)
- [ ] Verify all form fields (Title, Alternate Titles, Genres, Cover Images, Synopsis, Chapters) are reachable via scrolling
- [ ] Verify a visible scrollbar is present in the body scroll region
- [ ] Click the "Add Manga" button in the header to confirm it is clickable (no overlays blocking it)
- [ ] Verify the page behind the modal does NOT scroll when scrolling inside the dialog (overscroll-behavior: contain)

### 2. Mobile Viewport (375x667 - iPhone SE)
- [ ] Resize browser to 375x667 or use browser DevTools mobile emulation
- [ ] Open the Add Manga dialog
- [ ] Verify the dialog fills the viewport height appropriately (90vh/90dvh)
- [ ] Verify the header stays fixed at the top while scrolling
- [ ] Verify the body area scrolls independently with max-height: 400px
- [ ] Scroll the dialog body using touch/trackpad gestures
- [ ] Verify all form fields are reachable
- [ ] Tap the "Add Manga" button to confirm it is tappable
- [ ] Verify no horizontal scrolling is required
- [ ] Verify background page does not scroll when interacting with dialog body

### 3. Tablet Viewport (768x1024 - iPad)
- [ ] Resize browser to 768x1024 or use browser DevTools tablet emulation
- [ ] Open the Add Manga dialog
- [ ] Verify the dialog is properly constrained (90vh/90dvh)
- [ ] Verify header remains fixed during body scroll
- [ ] Verify the body area has max-height: 400px and scrolls properly
- [ ] Verify scrolling works smoothly
- [ ] Verify buttons are accessible
- [ ] Verify visible scrollbar is present

### 4. Edge Cases
- [ ] Open dialog, scroll to bottom, verify "Add Manga" button in header is visible and clickable
- [ ] Open dialog, scroll to middle, verify header remains in fixed position
- [ ] Fill out a long synopsis (multiple paragraphs), verify scrolling still works
- [ ] Add 4 alternate titles, verify layout does not break
- [ ] Upload multiple cover images, verify scrolling accommodates the preview grid
- [ ] Verify the scrollable body respects the 400px max-height constraint (inline style)
- [ ] Verify scrollbar remains visible and styled consistently after layout changes

## Expected Behavior
- Dialog height is constrained to viewport using `90vh` or `90dvh` (responsive)
- Dialog uses flex layout with `flex-col` and `overflow-hidden` to enable proper scrolling
- Header is fixed at top with `shrink-0` and contains action buttons
- Body is scrollable with `flex-1 min-h-0` and `max-height: 400px` inline style
- Body has `overscroll-behavior: contain` to prevent background page scroll
- Body uses dedicated `.add-manga-dialog-scroll-body` class for deterministic scrollbar styling
- No part of the dialog extends beyond the viewport
- Page behind the modal does not scroll when interacting with the dialog
- All interactive elements (inputs, buttons) are reachable and clickable
- The middle scrollable area never exceeds 400px in height
- Scrollbar is always visible when content overflows

## Failure Indicators
- ❌ "Add Manga" button is not visible or not clickable
- ❌ Dialog extends beyond viewport, requiring page scroll to reach buttons
- ❌ Body does not scroll or scrolls the page instead of the dialog body
- ❌ Buttons are overlaid by other elements or have `pointer-events: none`
- ❌ Horizontal scrolling is required on mobile
- ❌ Header scrolls with the body content instead of staying fixed
- ❌ Body area exceeds 400px max-height
- ❌ Scrollbar disappears or loses styling after layout regeneration
- ❌ Background page scrolls when scrolling inside dialog body

## Implementation Details (AR-2/AR-5 Fix)
- **Deterministic structure**: Fixed header + single scrollable body (no footer)
- **Viewport constraint**: `max-h-[90vh] md:max-h-[90dvh]` on DialogContent
- **Flex layout**: `flex flex-col overflow-hidden` on DialogContent
- **Header**: `shrink-0` with action buttons inline
- **Body**: `flex-1 min-h-0` with inline `maxHeight: '400px'` and `overflowY: 'scroll'`
- **Overscroll prevention**: `overscrollBehavior: 'contain'` inline style
- **Scrollbar lock**: Dedicated `.add-manga-dialog-scroll-body` class with `!important` rules
- **Cross-browser**: Webkit and Firefox scrollbar styling

## Notes
- This checklist should be run after any changes to `AddMangaDialog.tsx` or related UI components
- Use browser DevTools to simulate different viewport sizes accurately
- Test on actual mobile devices when possible for touch interaction verification
- The 400px max-height constraint on the scrollable body is enforced via inline style and is critical for the layout
- The `.add-manga-dialog-scroll-body` class uses `!important` to prevent regression during future style changes
- Action buttons are in the header (not a separate footer) for this dialog's design
