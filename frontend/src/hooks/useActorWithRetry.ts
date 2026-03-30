import { useBackendConnectionSingleton } from './useBackendConnectionSingleton';

/**
 * Extended version of useActor that adds connection state tracking and retry functionality.
 * Now delegates to the singleton connection hook to prevent multiple connection loops.
 */
export function useActorWithRetry() {
  const connection = useBackendConnectionSingleton();

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
    retryCount: connection.attemptNumber,
    elapsedTime: connection.elapsedTime,
    connectionPhase: connection.connectionPhase,
    hasGivenUp: connection.hasGivenUp,
  };
}
