# Pre-Deploy Layout Verification Checklist

## Purpose
This checklist ensures that layout regressions are caught before deployment. Follow this checklist on common viewport sizes (mobile: 375px, tablet: 768px, desktop: 1440px) before deploying any frontend changes.

## Critical Layout Components

### 1. AppLayout (Header/Footer)
**File:** `frontend/src/components/layout/AppLayout.tsx`

#### Expanded State
- [ ] Logo is visible and properly sized (40x40px)
- [ ] Title "MangaList" is visible and properly styled
- [ ] Login/Logout button is visible and accessible
- [ ] Collapse toggle button (ChevronUp icon) is visible on the right
- [ ] Header has proper padding (py-4)
- [ ] Header is sticky at top of viewport

#### Collapsed State
- [ ] Logo and title are hidden
- [ ] Login/Logout button is hidden
- [ ] Collapse toggle button (ChevronDown icon) is centered
- [ ] Header has reduced padding (py-2)
- [ ] Header remains sticky at top of viewport
- [ ] No layout jump or flash during transition

#### Footer
- [ ] Footer is positioned at bottom with proper spacing (mt-16 py-8)
- [ ] Attribution text is centered and readable
- [ ] caffeine.ai link is functional and styled correctly

### 2. MangaListPage (Main Content)
**File:** `frontend/src/components/manga/MangaListPage.tsx`

#### Overall Layout
- [ ] Page container has proper padding (px-4 py-8)
- [ ] No unexpected horizontal overflow
- [ ] Floating controls panel is sticky and accessible
- [ ] Watchlist rows align according to selected alignment (left/center/right)

#### Row Sizing
- [ ] All manga rows have uniform width (minimum 925px)
- [ ] Rows are properly centered/aligned based on alignment setting
- [ ] Horizontal scroll appears when rows exceed viewport width
- [ ] No vertical alignment issues between rows

#### Loading States
- [ ] Skeleton loaders match expected row dimensions (78px height)
- [ ] Loading indicators don't cause layout shift
- [ ] Connection status alerts are properly positioned

#### Error States
- [ ] Error messages are readable and properly styled
- [ ] Retry buttons are accessible and functional
- [ ] Empty state (no manga) is centered and readable

### 3. AddMangaDialog (Modal)
**File:** `frontend/src/components/manga/AddMangaDialog.tsx`

#### Dialog Structure
- [ ] Dialog opens without layout shift on main page
- [ ] Dialog is centered on viewport
- [ ] Dialog has proper max-width and padding

#### Fixed Header
- [ ] Dialog title is visible and fixed at top
- [ ] Action buttons (Cancel/Save) are visible and fixed at top
- [ ] Header does not scroll with body content
- [ ] Header has proper bottom border/separator

#### Scrollable Body
- [ ] Body content scrolls independently from header
- [ ] Scroll container has 400px max-height
- [ ] Scrollbar is visible when content overflows
- [ ] Overscroll containment prevents parent scroll
- [ ] All form fields are accessible via scroll

#### Form Fields
- [ ] All input fields are properly sized and aligned
- [ ] Genre checkboxes are in a grid (max 3 columns)
- [ ] Cover image upload area is visible and functional
- [ ] No form fields are cut off or inaccessible

## Testing Procedure

### Desktop (1440px viewport)
1. Open application in browser
2. Verify AppLayout in both expanded and collapsed states
3. Navigate to MangaListPage and verify row alignment
4. Open AddMangaDialog and verify fixed header + scrollable body
5. Test all three watchlist alignment options (left/center/right)

### Tablet (768px viewport)
1. Resize browser to 768px width
2. Repeat all desktop tests
3. Verify responsive behavior of header and controls
4. Check that dialog remains properly sized

### Mobile (375px viewport)
1. Resize browser to 375px width
2. Repeat all desktop tests
3. Verify horizontal scroll works for wide rows
4. Check that dialog is properly sized for small screens

## Common Issues to Watch For
- **Layout jumps** during header collapse/expand
- **Horizontal overflow** on main page container
- **Modal scroll issues** (body scrolling instead of dialog content)
- **Unclickable elements** due to z-index or pointer-events issues
- **Misaligned rows** in watchlist
- **Cut-off content** in dialogs or forms

## Sign-Off
Before deploying, confirm:
- [ ] All checklist items pass on desktop viewport
- [ ] All checklist items pass on tablet viewport
- [ ] All checklist items pass on mobile viewport
- [ ] No console errors related to layout or rendering
- [ ] No visual regressions compared to previous stable version

**Tester:** _________________  
**Date:** _________________  
**Version:** _________________
