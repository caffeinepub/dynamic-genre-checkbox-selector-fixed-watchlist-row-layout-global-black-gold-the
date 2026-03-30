/**
 * Unified backend-not-ready message used across the application
 */

export const BACKEND_NOT_READY_MESSAGE = 
  'Backend is not ready. Please wait for the connection to be established.';

/**
 * Check if backend is ready and throw consistent error if not
 */
export function assertBackendReady(isReady: boolean, actor: unknown): asserts actor {
  if (!isReady || !actor) {
    throw new Error(BACKEND_NOT_READY_MESSAGE);
  }
}
