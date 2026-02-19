# MangaListPage Layout Regression Checklist

## Component
`frontend/src/components/manga/MangaListPage.tsx`

## Purpose
Verify that the MangaListPage maintains correct overall page structure, row width/alignment, overflow behavior, and loading/error state layout consistency.

## Test Cases

### Overall Page Structure
- [ ] Page has proper spacing (space-y-6)
- [ ] Container has proper padding from AppLayout
- [ ] No unexpected horizontal overflow on page container
- [ ] Floating controls panel is sticky and accessible
- [ ] Pagination controls are visible when needed (totalPages > 1)

### Row Width and Alignment
- [ ] All manga rows have uniform width (measured by useUniformWatchlistRowWidth)
- [ ] Minimum row width is 925px (MIN_ROW_WIDTH constant)
- [ ] Rows respect watchlistAlignment setting:
  - [ ] Left alignment (items-start)
  - [ ] Center alignment (items-center)
  - [ ] Right alignment (items-end)
- [ ] Row width is applied via inline style (width and minWidth)
- [ ] Rows are wrapped in flex container with proper alignment class

### Horizontal Overflow Behavior
- [ ] Parent container has overflow-x-auto
- [ ] Horizontal scrollbar appears when rows exceed viewport width
- [ ] Scrollbar has proper padding (pb-4)
- [ ] Scroll behavior is smooth and predictable
- [ ] No vertical scrollbar appears unexpectedly

### Vertical Layout
- [ ] Rows are stacked vertically with gap-4
- [ ] No unexpected vertical spacing issues
- [ ] Pagination controls have proper top spacing
- [ ] Empty state is centered vertically

### Loading States
- [ ] Skeleton loaders match expected dimensions (h-[78px])
- [ ] Skeleton loaders have proper width (w-full max-w-[925px])
- [ ] 8 skeleton rows are shown during initial load
- [ ] Loading state doesn't cause layout shift
- [ ] Connection status alert is properly positioned

### Error States
- [ ] Connection error shows proper alert with icon
- [ ] Error message is readable and centered
- [ ] Retry button is accessible and functional
- [ ] Reload button is accessible and functional
- [ ] Error state doesn't cause horizontal overflow

### Empty States
- [ ] Empty state is centered (text-center py-16)
- [ ] Empty state has dashed border (border-2 border-dashed)
- [ ] Icon is properly sized (h-16 w-16)
- [ ] Text is readable and properly spaced
- [ ] "Add Your First Manga" button is visible when no filters

### Offline Mode
- [ ] Offline alert is visible at top when in offline mode
- [ ] Alert has proper icon (WifiOff)
- [ ] Alert message is clear and readable
- [ ] Cached data is displayed correctly

### Floating Controls Panel
- [ ] Panel is sticky at top of content area
- [ ] Panel remains visible when scrolling
- [ ] Panel has proper z-index to stay above rows
- [ ] Panel collapse/expand works correctly
- [ ] All controls are accessible in both states

### Pagination
- [ ] Pagination controls are centered
- [ ] Page numbers are readable
- [ ] Previous/Next buttons work correctly
- [ ] Page jump input is functional
- [ ] Pagination respects disabled state

## Viewport Testing

### Mobile (375px)
- [ ] Horizontal scroll works for wide rows (925px)
- [ ] Floating controls panel is accessible
- [ ] Pagination controls are usable
- [ ] No unexpected layout breaks

### Tablet (768px)
- [ ] Rows align correctly based on alignment setting
- [ ] Horizontal scroll appears when needed
- [ ] All controls are accessible

### Desktop (1440px)
- [ ] Rows are properly aligned (especially center alignment)
- [ ] No horizontal scroll when rows fit viewport
- [ ] All spacing is consistent

## Filter and Sort Behavior
- [ ] Applying filters doesn't break layout
- [ ] Changing sort order doesn't break layout
- [ ] Clearing filters restores proper layout
- [ ] Filter count updates correctly

## Known Issues to Avoid
1. **Misaligned rows** - All rows must have uniform width
2. **Broken horizontal scroll** - Must appear when rows exceed viewport
3. **Layout shift during loading** - Skeleton loaders must match actual row size
4. **Floating controls overlap** - Controls must have proper z-index
5. **Pagination overflow** - Controls must fit within viewport
6. **Empty state misalignment** - Must be centered properly

## Sign-Off
- [ ] All test cases pass on mobile viewport
- [ ] All test cases pass on tablet viewport
- [ ] All test cases pass on desktop viewport
- [ ] No visual regressions
- [ ] No console errors

**Tester:** _________________  
**Date:** _________________
