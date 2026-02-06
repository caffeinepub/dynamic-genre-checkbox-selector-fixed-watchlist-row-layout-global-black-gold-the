# Specification

## Summary
**Goal:** Tweak the MangaCard title-cycle arrow’s placement and styling, and ensure chapter progress text correctly displays decimal values.

**Planned changes:**
- In `frontend/src/components/manga/MangaCard.tsx`, adjust the ArrowRight title-cycle icon’s vertical positioning so it renders 5px lower while keeping the existing gutter/rating alignment behavior consistent (including the no-alternate-title spacer case).
- In `frontend/src/components/manga/MangaCard.tsx`, change the ArrowRight title-cycle icon color from green to a dark brown.
- Audit and update chapter progress number formatting in `frontend/src/components/manga/MangaCard.tsx` and `frontend/src/utils/formatChapterNumber.ts` so decimal values are preserved in the displayed `chapters read/chapters available` text (without adding unnecessary decimals for whole numbers).

**User-visible outcome:** The title-cycle arrow appears slightly lower and in dark brown, and chapter progress displays decimals accurately (e.g., `104.5/200`) without truncation.
