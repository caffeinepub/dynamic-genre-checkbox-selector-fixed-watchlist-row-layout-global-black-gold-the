# Specification

## Summary
**Goal:** Prevent the frontend from calling the backend before the canister/actor is actually reachable and fully initialized, with clear readiness states, bounded retries, and non-spammy UI behavior.

**Planned changes:**
- Add an unauthenticated, non-mutating backend readiness query endpoint (e.g., health/ready) that is safe for anonymous callers and can be used to detect “unreachable/not ready”.
- Update frontend actor initialization to expose a single readiness state (e.g., `isActorReady`) that only becomes true after actor creation, any access-control initialization succeeds, and a backend readiness check passes.
- Guard all backend queries/mutations (including React Query hooks, pagination, and manga submission) so they do not run while readiness is false and do not produce “Actor not available” during normal startup.
- Implement bounded retry/backoff for readiness/connection checks and classify errors so the UI differentiates: connecting/not ready vs connection failed vs application-level errors (e.g., Unauthorized), without retrying non-transient auth/app errors.
- Harden UI interactions during connecting/retrying: disable relevant buttons/forms, show “connecting to backend” messaging, debounce/disable retry while in-flight, and avoid console-spam refetch loops during initialization.

**User-visible outcome:** The app reliably shows a clear “connecting to backend” state on startup, avoids premature backend calls, and provides an actionable retry flow when connection/initialization fails—while still supporting anonymous sessions without misclassifying them as authenticated-ready.
