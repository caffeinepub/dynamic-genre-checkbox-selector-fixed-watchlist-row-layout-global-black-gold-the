# Specification

## Summary
**Goal:** Adjust the green title-cycle arrow positioning to overlap ratings without reflow, and add a collapsible sticky app header.

**Planned changes:**
- In MangaCard rows, shift the green cycle-title arrow up by 25px and allow it to visually overlap the rating area via layering (no layout/padding/margin changes that move the rating away).
- In the cover hover popup title area, apply the same 25px upward shift and allow overlap without resizing/reflowing surrounding content.
- Make the top sticky header collapsible with a visible toggle control that collapses/expands the branding area and login/logout button, including accessible English aria-label text.

**User-visible outcome:** The title-cycle arrow sits 25px higher and can overlap ratings in both the list and popup without pushing content around, and the sticky header can be collapsed/expanded via an on-header toggle while keeping the page usable.
