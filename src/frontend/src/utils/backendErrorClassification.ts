/**
 * Classifies backend errors into categories for appropriate retry behavior and UI messaging
 */

export type ErrorCategory = 
  | 'connecting' // Initial connection/not ready
  | 'transient' // Temporary network/connection issues
  | 'authorization' // Auth/permission errors
  | 'application'; // Application-level errors

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

  // Transient connection errors
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('fetch failed') ||
    lowerMessage.includes('connection') ||
    lowerMessage.includes('unreachable') ||
    lowerMessage.includes('econnrefused') ||
    lowerMessage.includes('enotfound') ||
    lowerMessage.includes('backend not ready')
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
    lowerMessage.includes('not authenticated')
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
