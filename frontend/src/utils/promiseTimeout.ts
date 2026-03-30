/**
 * Utility to wrap promises with a hard timeout
 */

export class TimeoutError extends Error {
  constructor(message: string, public readonly timeoutMs: number) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Wrap a promise with a hard timeout
 * @param promise The promise to wrap
 * @param timeoutMs Maximum time to wait in milliseconds
 * @param errorMessage Custom error message for timeout
 * @returns Promise that rejects with TimeoutError if timeout is exceeded
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage?: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new TimeoutError(
          errorMessage || `Operation timed out after ${timeoutMs}ms`,
          timeoutMs
        )
      );
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

/**
 * Create a timeout promise that rejects after specified time
 */
export function createTimeout(timeoutMs: number, errorMessage?: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(
        new TimeoutError(
          errorMessage || `Timeout after ${timeoutMs}ms`,
          timeoutMs
        )
      );
    }, timeoutMs);
  });
}
