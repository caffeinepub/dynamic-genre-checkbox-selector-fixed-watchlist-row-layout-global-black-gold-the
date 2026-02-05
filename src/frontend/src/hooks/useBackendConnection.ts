import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useInternetIdentity } from './useInternetIdentity';
import { useState, useCallback, useRef } from 'react';
import { type backendInterface } from '../backend';
import { createActorWithConfig } from '../config';
import { getSecretParameter } from '../utils/urlParams';
import { withTimeout } from '../utils/promiseTimeout';
import { classifyError, isRetryableError } from '../utils/backendErrorClassification';

export type ConnectionStatus = 'connecting' | 'ready' | 'failed';

export interface BackendConnectionState {
  status: ConnectionStatus;
  actor: backendInterface | null;
  isConnecting: boolean;
  isReady: boolean;
  isFailed: boolean;
  error: unknown | null;
  errorMessage: string | null;
  errorCategory: 'connecting' | 'transient' | 'authorization' | 'application' | 'timeout' | null;
  retry: () => Promise<void>;
  isRetrying: boolean;
}

const ACTOR_CREATION_TIMEOUT = 15000; // 15 seconds
const READINESS_CHECK_TIMEOUT = 10000; // 10 seconds
const MAX_TOTAL_CONNECTION_TIME = 45000; // 45 seconds total
const MAX_RETRIES = 3;
const BASE_DELAY = 1000;
const MAX_DELAY = 8000;

/**
 * Unified backend connection hook that manages actor initialization and readiness
 * with hard timeouts and bounded retry behavior
 */
export function useBackendConnection(): BackendConnectionState {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const connectionStartTime = useRef<number>(0);

  const connectionQuery = useQuery({
    queryKey: ['backend-connection', identity?.getPrincipal().toString(), retryTrigger],
    queryFn: async () => {
      // Track connection start time
      if (connectionStartTime.current === 0) {
        connectionStartTime.current = Date.now();
      }

      // Check if we've exceeded total connection time
      const elapsed = Date.now() - connectionStartTime.current;
      if (elapsed >= MAX_TOTAL_CONNECTION_TIME) {
        throw new Error(
          `Connection exceeded maximum time of ${MAX_TOTAL_CONNECTION_TIME / 1000}s`
        );
      }

      // Step 1: Create actor with timeout
      const actor = await withTimeout(
        (async () => {
          const isAuthenticated = !!identity;
          const actorOptions = isAuthenticated
            ? { agentOptions: { identity } }
            : undefined;

          const newActor = await createActorWithConfig(actorOptions);

          // Initialize access control if authenticated
          if (isAuthenticated) {
            const adminToken = getSecretParameter('caffeineAdminToken') || '';
            await newActor._initializeAccessControlWithSecret(adminToken);
          }

          return newActor;
        })(),
        ACTOR_CREATION_TIMEOUT,
        'Actor creation timed out'
      );

      // Step 2: Check readiness with timeout
      const isReady = await withTimeout(
        actor.isReady(),
        READINESS_CHECK_TIMEOUT,
        'Readiness check timed out'
      );

      if (!isReady) {
        throw new Error('Backend reported not ready');
      }

      return actor;
    },
    enabled: true,
    retry: (failureCount, error) => {
      // Check total elapsed time
      const elapsed = Date.now() - connectionStartTime.current;
      if (elapsed >= MAX_TOTAL_CONNECTION_TIME) {
        return false;
      }

      // Check retry count
      if (failureCount >= MAX_RETRIES) {
        return false;
      }

      // Only retry retryable errors
      return isRetryableError(error);
    },
    retryDelay: (attemptIndex) => {
      const exponentialDelay = Math.min(
        BASE_DELAY * Math.pow(2, attemptIndex),
        MAX_DELAY
      );
      const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
      return Math.floor(exponentialDelay + jitter);
    },
    staleTime: Infinity,
    gcTime: 60000,
  });

  // Determine connection status
  let status: ConnectionStatus = 'connecting';
  if (connectionQuery.isSuccess && connectionQuery.data) {
    status = 'ready';
  } else if (connectionQuery.isError) {
    status = 'failed';
  }

  const classified = connectionQuery.error ? classifyError(connectionQuery.error) : null;

  const retry = useCallback(async () => {
    if (isRetrying) return;

    setIsRetrying(true);
    try {
      // Reset connection timer
      connectionStartTime.current = Date.now();

      // Cancel any in-flight queries
      await queryClient.cancelQueries({ queryKey: ['backend-connection'] });

      // Trigger new connection attempt
      setRetryTrigger((prev) => prev + 1);

      // Wait a moment for the query to start
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Invalidate dependent queries after successful reconnection
      await queryClient.invalidateQueries({ queryKey: ['mangaPage'] });
      await queryClient.invalidateQueries({ queryKey: ['allMangaEntries'] });
      await queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    } finally {
      setTimeout(() => {
        setIsRetrying(false);
      }, 500);
    }
  }, [isRetrying, queryClient]);

  return {
    status,
    actor: connectionQuery.data || null,
    isConnecting: status === 'connecting',
    isReady: status === 'ready',
    isFailed: status === 'failed',
    error: connectionQuery.error,
    errorMessage: classified?.userMessage || null,
    errorCategory: classified?.category || null,
    retry,
    isRetrying,
  };
}
