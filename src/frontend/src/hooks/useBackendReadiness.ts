import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { classifyError, isRetryableError } from '../utils/backendErrorClassification';
import { useState, useCallback } from 'react';

export type ReadinessStatus = 'idle' | 'connecting' | 'ready' | 'failed';

export interface BackendReadinessState {
  status: ReadinessStatus;
  isActorReady: boolean;
  isConnecting: boolean;
  isFailed: boolean;
  error: unknown | null;
  errorMessage: string | null;
  errorCategory: 'connecting' | 'transient' | 'authorization' | 'application' | null;
  retry: () => void;
  retryCount: number;
}

const MAX_RETRIES = 5;
const BASE_DELAY = 500;
const MAX_DELAY = 10000;

/**
 * Hook that performs backend readiness check and provides a single source of truth
 * for whether the backend is ready to accept calls
 */
export function useBackendReadiness(): BackendReadinessState {
  const { actor, isFetching: actorFetching } = useActor();
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  const readinessQuery = useQuery({
    queryKey: ['backend-readiness', retryTrigger],
    queryFn: async () => {
      if (!actor) {
        throw new Error('Actor not available - still initializing');
      }

      // Call the backend readiness endpoint
      try {
        const isReady = await actor.isReady();
        if (!isReady) {
          throw new Error('Backend not ready');
        }
        return true;
      } catch (error) {
        // Preserve original error for accurate classification
        throw error;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: (failureCount, error) => {
      // Only retry if error is retryable and we haven't exceeded max retries
      if (failureCount >= MAX_RETRIES) {
        return false;
      }
      return isRetryableError(error);
    },
    retryDelay: (attemptIndex) => {
      // Exponential backoff with jitter
      const exponentialDelay = Math.min(
        BASE_DELAY * Math.pow(2, attemptIndex),
        MAX_DELAY
      );
      const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
      return Math.floor(exponentialDelay + jitter);
    },
    staleTime: 30000, // Consider ready state fresh for 30 seconds
    gcTime: 60000,
  });

  const retry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    setRetryTrigger(prev => prev + 1);
  }, []);

  // Determine status - keep in connecting state if actor is not available
  let status: ReadinessStatus = 'idle';
  if (actorFetching || !actor) {
    status = 'connecting';
  } else if (readinessQuery.isLoading) {
    status = 'connecting';
  } else if (readinessQuery.isSuccess && readinessQuery.data === true) {
    status = 'ready';
  } else if (readinessQuery.isError) {
    status = 'failed';
  }

  const isActorReady = status === 'ready';
  const isConnecting = status === 'connecting';
  const isFailed = status === 'failed';

  const classified = readinessQuery.error ? classifyError(readinessQuery.error) : null;

  return {
    status,
    isActorReady,
    isConnecting,
    isFailed,
    error: readinessQuery.error,
    errorMessage: classified?.userMessage || null,
    errorCategory: classified?.category || null,
    retry,
    retryCount,
  };
}
