# AppLayout Regression Checklist

## Component
`frontend/src/components/layout/AppLayout.tsx`

## Purpose
Verify that the AppLayout component maintains correct header collapse/expand behavior, sticky positioning, and footer placement across viewport sizes.

## Test Cases

### Header - Expanded State
- [ ] Logo image loads from `/assets/generated/app-logo.dim_512x512.png`
- [ ] Logo is 40x40px (h-10 w-10)
- [ ] Title "MangaList" is visible with proper styling (text-2xl font-bold)
- [ ] LoginLogoutButton is visible and functional
- [ ] Collapse toggle button shows ChevronUp icon
- [ ] Header has py-4 padding
- [ ] Header has border-bottom (border-b border-border)
- [ ] Header has backdrop blur effect (backdrop-blur-sm)

### Header - Collapsed State
- [ ] Logo is hidden
- [ ] Title is hidden
- [ ] LoginLogoutButton is hidden
- [ ] Collapse toggle button shows ChevronDown icon
- [ ] Toggle button is centered (mx-auto)
- [ ] Header has py-2 padding (reduced)
- [ ] Header maintains border and backdrop blur

### Header - Sticky Behavior
- [ ] Header is sticky at top (sticky top-0)
- [ ] Header has z-50 to stay above content
- [ ] Header remains visible when scrolling down
- [ ] No layout jump when transitioning between states
- [ ] Smooth transition (transition-all duration-300)

### Footer
- [ ] Footer has top border (border-t border-border)
- [ ] Footer has proper spacing (mt-16 py-8)
- [ ] Footer text is centered
- [ ] Footer text is muted (text-muted-foreground)
- [ ] Attribution includes "© 2026. Built with ❤️ using caffeine.ai"
- [ ] caffeine.ai link is functional and opens in new tab
- [ ] Link has hover effect (hover:text-foreground)

### Responsive Behavior
- [ ] Container has proper horizontal padding (px-4)
- [ ] Container is centered (mx-auto)
- [ ] Layout works on mobile (375px)
- [ ] Layout works on tablet (768px)
- [ ] Layout works on desktop (1440px+)

### Main Content Area
- [ ] Main has container class with mx-auto
- [ ] Main has proper padding (px-4 py-8)
- [ ] Children render correctly in main area
- [ ] No unexpected overflow

## Viewport Testing

### Mobile (375px)
- [ ] Header collapses/expands without horizontal overflow
- [ ] Toggle button is easily tappable
- [ ] Footer text wraps properly if needed

### Tablet (768px)
- [ ] All header elements have proper spacing
- [ ] No layout issues during collapse/expand

### Desktop (1440px)
- [ ] Header elements are well-spaced
- [ ] Container max-width is appropriate
- [ ] Footer is properly positioned

## Known Issues to Avoid
1. **Layout jump during collapse** - Ensure smooth transition without content shift
2. **Toggle button misalignment** - Button should be centered when collapsed
3. **Missing sticky behavior** - Header must stay at top when scrolling
4. **Z-index conflicts** - Header should be above all content (z-50)
5. **Asset loading failure** - Logo path must be correct

## Sign-Off
- [ ] All test cases pass
- [ ] No visual regressions
- [ ] No console errors
- [ ] Smooth user experience

**Tester:** _________________  
**Date:** _________________
