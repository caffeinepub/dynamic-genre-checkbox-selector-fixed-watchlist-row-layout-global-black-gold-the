/**
 * Bounded exponential backoff utility for retrying operations
 */

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

export interface RetryState {
  attempt: number;
  isRetrying: boolean;
  lastError: unknown | null;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 5,
  baseDelay: 500,
  maxDelay: 10000,
};

/**
 * Calculate delay for exponential backoff with jitter
 */
export function calculateBackoffDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = Math.min(
    config.baseDelay * Math.pow(2, attempt),
    config.maxDelay
  );
  
  // Add jitter (±25%)
  const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
  return Math.floor(exponentialDelay + jitter);
}

/**
 * Execute an async operation with bounded exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  let lastError: unknown;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      const shouldRetry = finalConfig.shouldRetry
        ? finalConfig.shouldRetry(error, attempt)
        : true;

      if (!shouldRetry || attempt >= finalConfig.maxRetries) {
        throw error;
      }

      // Wait before retrying
      const delay = calculateBackoffDelay(attempt, finalConfig);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Create a retry manager for manual retry control
 */
export class RetryManager {
  private attempt = 0;
  private isRetrying = false;
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.isRetrying) {
      throw new Error('Retry already in progress');
    }

    this.isRetrying = true;
    this.attempt = 0;

    try {
      return await retryWithBackoff(operation, {
        ...this.config,
        shouldRetry: (error, attempt) => {
          this.attempt = attempt + 1;
          return this.config.shouldRetry
            ? this.config.shouldRetry(error, attempt)
            : true;
        },
      });
    } finally {
      this.isRetrying = false;
    }
  }

  reset() {
    this.attempt = 0;
    this.isRetrying = false;
  }

  getState(): RetryState {
    return {
      attempt: this.attempt,
      isRetrying: this.isRetrying,
      lastError: null,
    };
  }
}
