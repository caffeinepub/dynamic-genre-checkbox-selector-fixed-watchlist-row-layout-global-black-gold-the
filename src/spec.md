# Specification

## Summary
**Goal:** Improve the Add Manga dialog usability with a fixed header/footer and a scrollable form body, and reduce recurring backend connection/readiness errors through more resilient frontend gating and recovery.

**Planned changes:**
- Update the Add Manga modal layout so the middle form section uses a max height of 600px with vertical scrolling, while the header and footer remain fixed and always visible.
- Ensure scrolling inside the Add Manga modal only scrolls the dialog body (not the underlying page) and remains usable on small viewports without horizontal scrolling.
- Add a frontend stability pass around existing actor/readiness usage to better handle startup null/uninitialized actor states (stay in connecting/waiting rather than failing).
- Improve reconnect/retry behavior to perform full recovery (re-check readiness and refresh/refetch actor state as needed) and prevent spammy failing requests in manga list and add-manga flows during reconnect scenarios.
- Refine connection status/error messaging to distinguish connecting/initializing vs transient network issues vs authorization-required states, avoiding false permanent-failure labeling.

**User-visible outcome:** The Add Manga dialog keeps its title and action buttons visible while the form scrolls within a 600px body, and the app more reliably connects/reconnects to the backend so listing manga and adding manga work again after reconnect without a full page reload.
