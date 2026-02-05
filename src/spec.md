# Specification

## Summary
**Goal:** Make the Add Manga dialog reliably clickable and prevent “Actor not available” warnings by improving dialog layout and gating submission until the backend actor is ready.

**Planned changes:**
- Update the Add Manga dialog layout to a stable flex column structure (header + scrollable body + fixed footer) so only the form body scrolls and footer buttons remain fully interactive.
- Fix any overlapping/hidden layers within the dialog that could block pointer events on the Cancel/Add Manga buttons after entering metadata.
- Disable Add Manga submission while the backend actor is initializing/null and show a clear English loading/connecting message instead of the raw “Actor not available” warning; enable submission automatically once the actor becomes available.

**User-visible outcome:** The Add Manga dialog remains usable after filling out all fields, the Add Manga button consistently works, and users see a clear loading/connecting state (not “Actor not available”) until the actor is ready—without needing a page refresh.
