# Specification

## Summary
**Goal:** Make the “Add Manga” modal dialog usable on small screens by ensuring its form content scrolls within the dialog and the bottom action buttons remain reachable and clickable.

**Planned changes:**
- Constrain the Add Manga dialog height to fit within the viewport on short laptop screens and mobile, preventing off-screen overflow.
- Make the dialog body (form fields) scrollable inside the modal so all inputs can be reached without scrolling the page behind the modal.
- Ensure the “Cancel” and “Add Manga” buttons are always reachable (visible or reachable via internal dialog scrolling) and not blocked/overlaid, across mouse and touch scrolling.
- Add a minimal in-repo manual regression checklist to verify the dialog max-height constraint and internal scrolling keep the “Add Manga” button accessible at small viewport heights.

**User-visible outcome:** On small screens, users can always scroll through the Add Manga form and reliably reach and click the “Cancel” and “Add Manga” buttons without the dialog extending off-screen.
