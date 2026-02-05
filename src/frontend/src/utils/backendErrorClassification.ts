/**
 * Classifies backend errors into categories for appropriate retry behavior and UI messaging
 */

export type ErrorCategory = 
  | 'connecting' // Initial connection/not ready
  | 'transient' // Temporary network/connection issues
  | 'authorization' // Auth/permission errors
  | 'application' // Application-level errors
  | 'timeout'; // Timeout errors

export interface ClassifiedError {
  category: ErrorCategory;
  message: string;
  shouldRetry: boolean;
  userMessage: string;
}

/**
 * Classify an error based on its message and shape
 */
export function classifyError(error: unknown): ClassifiedError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();
  const errorName = error instanceof Error ? error.name : '';

  // Timeout errors - should retry with caution
  if (
    errorName === 'TimeoutError' ||
    lowerMessage.includes('timed out') ||
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('exceeded maximum total time')
  ) {
    return {
      category: 'timeout',
      message: errorMessage,
      shouldRetry: true,
      userMessage: 'Connection timed out. Please retry.',
    };
  }

  // Connecting/not ready states - do not label as failures
  if (
    lowerMessage.includes('actor not available') ||
    lowerMessage.includes('not initialized') ||
    lowerMessage.includes('still initializing') ||
    lowerMessage.includes('connecting') ||
    lowerMessage.includes('initializing')
  ) {
    return {
      category: 'connecting',
      message: errorMessage,
      shouldRetry: true,
      userMessage: 'Connecting to backend...',
    };
  }

  // Transient connection errors - includes IC-specific patterns
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('fetch failed') ||
    lowerMessage.includes('connection') ||
    lowerMessage.includes('unreachable') ||
    lowerMessage.includes('econnrefused') ||
    lowerMessage.includes('enotfound') ||
    lowerMessage.includes('backend not ready') ||
    lowerMessage.includes('canister') ||
    lowerMessage.includes('replica') ||
    lowerMessage.includes('request rejected') ||
    lowerMessage.includes('transport') ||
    lowerMessage.includes('agent') ||
    lowerMessage.includes('unavailable')
  ) {
    return {
      category: 'transient',
      message: errorMessage,
      shouldRetry: true,
      userMessage: 'Connection issue. Retrying...',
    };
  }

  // Authorization errors (should not retry automatically)
  if (
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('permission denied') ||
    lowerMessage.includes('access denied') ||
    lowerMessage.includes('forbidden') ||
    lowerMessage.includes('not authenticated') ||
    lowerMessage.includes('trap')
  ) {
    return {
      category: 'authorization',
      message: errorMessage,
      shouldRetry: false,
      userMessage: 'Authorization required. Please log in.',
    };
  }

  // Application-level errors (should not retry)
  return {
    category: 'application',
    message: errorMessage,
    shouldRetry: false,
    userMessage: errorMessage || 'An error occurred. Please try again.',
  };
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  return classifyError(error).shouldRetry;
}

/**
 * Get user-friendly message for an error
 */
export function getUserErrorMessage(error: unknown): string {
  return classifyError(error).userMessage;
}
