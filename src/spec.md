# Specification

## Summary
**Goal:** Add a completion-status filter and expand sorting options in the manga list controls.

**Planned changes:**
- Add a new checkbox control labeled “Complete only” to the existing floating filter/controls panel to filter the list to entries where `completed === true`.
- Ensure the new completion filter composes with existing filters (search, genre, bookmarked-only) and updates results immediately.
- Extend the “Sort By” dropdown with “Title (Z–A)” and “Rating (Low–High)” options.
- Apply sorting to the full filtered result set before pagination.

**User-visible outcome:** Users can toggle “Complete only” to show just completed manga, and can sort the list by title descending or rating ascending in addition to existing sort options.
