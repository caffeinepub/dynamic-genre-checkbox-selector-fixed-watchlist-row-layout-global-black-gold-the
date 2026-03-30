# Specification

## Summary
**Goal:** Remove single-user access restrictions so all Internet Identity users can log in with isolated personal watchlists, and restore the black background with gold outline color scheme across all UI components.

**Planned changes:**
- Remove any hard-coded principal IDs or whitelist-based access control from the backend so all authenticated Internet Identity principals can use the app
- Ensure each user's watchlist data is stored and retrieved per their own principal with no data leakage
- Remove any frontend logic that blocks or rejects users based on a specific principal
- Restore black (#000000) background and gold accent/outline colors across all pages, cards, buttons, inputs, borders, and headers
- Align Tailwind config and index.css CSS variables to the black and gold palette
- Preserve existing gold/rainbow hover and status effects

**User-visible outcome:** Any Internet Identity user can log in and manage their own private manga watchlist, and the entire app consistently displays the black background with gold outline color scheme.
