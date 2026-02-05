# Specification

## Summary
**Goal:** Improve the Add Manga modal scrolling behavior and add search/filter/sort controls to the manga list page, with consistent results across pagination.

**Planned changes:**
- Update the Add Manga dialog layout so the header and footer remain pinned while only the body scrolls, with the scrollable body constrained to a maximum height of 400px.
- Update the Add Manga dialog layout regression checklist to replace any 600px max-height references with 400px.
- Add three independent search inputs on the manga list page to filter by Title, Synopsis, and Notes using case-insensitive substring matching, combining filters with logical AND.
- Add a Genre filter button that opens a dropdown of genre checkboxes and filters the list to entries matching any selected genre.
- Add a bookmarked-only filter toggle to show only entries with bookmarks.length > 0.
- Add sorting controls to sort by Title or Rating, with default sorting set to Title (A–Z).
- Ensure search/filter/sort is applied consistently with pagination so page counts and displayed results reflect the filtered/sorted dataset, and page navigation preserves active settings.

**User-visible outcome:** The Add Manga modal scrolls correctly within its body while keeping controls visible, and the manga list can be searched, filtered (genre/bookmarked), and sorted with pagination reflecting the current criteria.
