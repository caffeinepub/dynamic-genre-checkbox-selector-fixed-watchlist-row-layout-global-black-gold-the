# Specification

## Summary
**Goal:** Improve manga adding and watchlist usability while applying a consistent global black-and-gold visual theme.

**Planned changes:**
- Update the Add Manga dialog to keep manual comma-separated genre entry and add a dynamic, organized checkbox list of existing genres derived from the user’s current library; selected checkbox genres combine with manual input with duplicates removed.
- Update watchlist entries to a fixed-size, non-shrinking row layout: exactly 78px tall and 900px wide, with a black background and a glowing gold outline.
- Adjust watchlist row contents so the cover image is flush left and constrained to a display area ≤35px wide, with the title immediately to the right constrained to a display area ≤250px wide (truncate with ellipsis as needed).
- Hide alternate titles in the watchlist entry UI.
- Apply a global theme so page backgrounds and all dropdowns/popups (dialogs, selects/popovers) use black backgrounds with gold outlines consistently.

**User-visible outcome:** Users can add manga genres faster by selecting from existing genre checkboxes (while still typing genres manually), see watchlist items in a consistent fixed row layout with cover and title aligned, no alternate titles displayed, and a consistent black background with gold-outlined popups and UI elements across the app.
