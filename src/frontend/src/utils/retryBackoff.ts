/**
 * Bounded exponential backoff utility for retrying operations
 */

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  maxTotalTime?: number; // Maximum total elapsed time in milliseconds
  operationTimeout?: number; // Timeout for each individual operation attempt
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

export interface RetryState {
  attempt: number;
  isRetrying: boolean;
  lastError: unknown | null;
  elapsedTime: number;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 5,
  baseDelay: 500,
  maxDelay: 10000,
  maxTotalTime: 30000, // 30 seconds total
  operationTimeout: 10000, // 10 seconds per attempt
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
  const startTime = Date.now();

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      // Check if we've exceeded total time budget
      const elapsedTime = Date.now() - startTime;
      if (finalConfig.maxTotalTime && elapsedTime >= finalConfig.maxTotalTime) {
        throw new Error(
          `Operation exceeded maximum total time of ${finalConfig.maxTotalTime}ms (elapsed: ${elapsedTime}ms)`
        );
      }

      // Execute operation with per-attempt timeout if configured
      let operationPromise = operation();
      if (finalConfig.operationTimeout) {
        const { withTimeout } = await import('./promiseTimeout');
        operationPromise = withTimeout(
          operationPromise,
          finalConfig.operationTimeout,
          `Operation attempt ${attempt + 1} timed out after ${finalConfig.operationTimeout}ms`
        );
      }

      return await operationPromise;
    } catch (error) {
      lastError = error;

      // Check if we should retry
      const shouldRetry = finalConfig.shouldRetry
        ? finalConfig.shouldRetry(error, attempt)
        : true;

      if (!shouldRetry || attempt >= finalConfig.maxRetries) {
        throw error;
      }

      // Check if we have time for another retry
      const elapsedTime = Date.now() - startTime;
      const delay = calculateBackoffDelay(attempt, finalConfig);
      if (
        finalConfig.maxTotalTime &&
        elapsedTime + delay >= finalConfig.maxTotalTime
      ) {
        throw new Error(
          `Cannot retry: would exceed maximum total time of ${finalConfig.maxTotalTime}ms`
        );
      }

      // Wait before retrying
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
  private startTime = 0;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.isRetrying) {
      throw new Error('Retry already in progress');
    }

    this.isRetrying = true;
    this.attempt = 0;
    this.startTime = Date.now();

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
    this.startTime = 0;
  }

  getState(): RetryState {
    return {
      attempt: this.attempt,
      isRetrying: this.isRetrying,
      lastError: null,
      elapsedTime: this.startTime > 0 ? Date.now() - this.startTime : 0,
    };
  }
}
