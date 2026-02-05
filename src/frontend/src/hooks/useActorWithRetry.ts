import { useBackendConnection } from './useBackendConnection';

/**
 * Extended version of useActor that adds connection state tracking and retry functionality
 * Now delegates to the unified connection hook
 */
export function useActorWithRetry() {
  const connection = useBackendConnection();

  return {
    actor: connection.actor,
    isFetching: connection.isConnecting,
    isConnecting: connection.isConnecting,
    isError: connection.isFailed,
    error: connection.error as Error | null,
    errorMessage: connection.errorMessage,
    errorCategory: connection.errorCategory,
    retry: connection.retry,
    isRetrying: connection.isRetrying,
    isActorReady: connection.isReady,
    readinessStatus: connection.status,
    retryCount: 0,
  };
}
