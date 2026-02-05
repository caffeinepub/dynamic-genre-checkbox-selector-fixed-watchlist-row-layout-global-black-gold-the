import { useState, useCallback } from 'react';
import { useActor } from './useActor';
import { useBackendReadiness } from './useBackendReadiness';

/**
 * Extended version of useActor that adds connection state tracking and retry functionality
 * This hook combines actor initialization state with backend readiness checks
 */
export function useActorWithRetry() {
  const { actor, isFetching: actorFetching } = useActor();
  const readiness = useBackendReadiness();
  const [isRetrying, setIsRetrying] = useState(false);

  const retry = useCallback(async () => {
    if (isRetrying) {
      return; // Prevent double retry
    }

    setIsRetrying(true);
    try {
      await readiness.retry();
    } finally {
      // Add a small delay before allowing another retry
      setTimeout(() => {
        setIsRetrying(false);
      }, 500);
    }
  }, [readiness, isRetrying]);

  // Combine states for backward compatibility
  const isConnecting = actorFetching || readiness.isConnecting || isRetrying;
  const isError = readiness.isFailed;
  const errorMessage = readiness.errorMessage;

  return {
    actor,
    isFetching: actorFetching,
    isConnecting,
    isError,
    error: readiness.error as Error | null,
    errorMessage,
    errorCategory: readiness.errorCategory,
    retry,
    isRetrying,
    isActorReady: readiness.isActorReady,
    readinessStatus: readiness.status,
    retryCount: readiness.retryCount,
  };
}
