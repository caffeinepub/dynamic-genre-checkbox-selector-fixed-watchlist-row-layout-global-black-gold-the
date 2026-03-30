export interface ClassifiedError {
  category: 'connecting' | 'transient' | 'authorization' | 'application' | 'timeout';
  message: string;
  userMessage: string;
  shouldRetry: boolean;
}

/**
 * Classifies backend errors into categories for appropriate handling and user messaging.
 * Enhanced to recognize stale/superseded attempts and prevent confusing error states.
 */
export function classifyError(error: unknown): ClassifiedError {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  // Superseded/stale attempts should not be surfaced as errors
  if (lowerMessage.includes('superseded') || lowerMessage.includes('stale')) {
    return {
      category: 'connecting',
      message: errorMessage,
      userMessage: 'Connecting to backend...',
      shouldRetry: false, // Don't retry - a newer attempt is already in progress
    };
  }

  // Timeout errors
  if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
    return {
      category: 'timeout',
      message: errorMessage,
      userMessage: 'Connection timed out. Please check your network and try again.',
      shouldRetry: true,
    };
  }

  // Authorization errors
  if (
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('forbidden') ||
    lowerMessage.includes('access denied') ||
    lowerMessage.includes('permission')
  ) {
    return {
      category: 'authorization',
      message: errorMessage,
      userMessage: 'You do not have permission to perform this action. Please log in.',
      shouldRetry: false,
    };
  }

  // IC-specific transient errors
  if (
    lowerMessage.includes('canister') ||
    lowerMessage.includes('replica') ||
    lowerMessage.includes('agent') ||
    lowerMessage.includes('boundary') ||
    lowerMessage.includes('network') ||
    lowerMessage.includes('connection') ||
    lowerMessage.includes('fetch')
  ) {
    return {
      category: 'transient',
      message: errorMessage,
      userMessage: 'Network issue detected. Retrying connection...',
      shouldRetry: true,
    };
  }

  // Connecting state
  if (lowerMessage.includes('connecting') || lowerMessage.includes('not ready')) {
    return {
      category: 'connecting',
      message: errorMessage,
      userMessage: 'Connecting to backend...',
      shouldRetry: true,
    };
  }

  // Application errors (default)
  return {
    category: 'application',
    message: errorMessage,
    userMessage: errorMessage,
    shouldRetry: false,
  };
}

export function isRetryableError(error: unknown): boolean {
  return classifyError(error).shouldRetry;
}
