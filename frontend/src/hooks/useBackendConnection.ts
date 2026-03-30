import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useInternetIdentity } from './useInternetIdentity';
import { useState, useCallback, useRef, useEffect } from 'react';
import { type backendInterface } from '../backend';
import { createActorWithConfig } from '../config';
import { getSecretParameter } from '../utils/urlParams';
import { withTimeout, TimeoutError } from '../utils/promiseTimeout';
import { classifyError } from '../utils/backendErrorClassification';

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
  // Diagnostic fields
  attemptNumber: number;
  elapsedTime: number;
  connectionPhase: string;
  hasGivenUp: boolean;
}

const ACTOR_CREATION_TIMEOUT = 15000; // 15 seconds
const READINESS_CHECK_TIMEOUT = 10000; // 10 seconds
const MAX_TOTAL_CONNECTION_TIME = 45000; // 45 seconds total
const MAX_AUTO_RETRIES = 5;
const BASE_DELAY = 1000;
const MAX_DELAY = 8000;

/**
 * Unified backend connection hook that manages actor initialization and readiness
 * with hard timeouts, bounded retry behavior, comprehensive diagnostics, and
 * stale-attempt protection using session generation to prevent race conditions across identity changes.
 * Includes automatic timeout safeguard that performs one internal full reset before giving up.
 */
export function useBackendConnection(): BackendConnectionState {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const connectionStartTime = useRef<number>(0);
  const lastPrincipal = useRef<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const elapsedTimeInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [connectionPhase, setConnectionPhase] = useState<string>('Initializing');
  const attemptCounter = useRef<number>(0);
  
  // Session generation to prevent stale attempts from updating state
  const sessionGeneration = useRef<number>(0);
  
  // Track whether we've used the automatic timeout safeguard for this session
  const hasUsedTimeoutSafeguard = useRef<boolean>(false);
  const [isPerformingSafeguardReset, setIsPerformingSafeguardReset] = useState(false);

  // Detect identity changes and reset connection
  const currentPrincipal = identity?.getPrincipal().toString() || null;
  useEffect(() => {
    if (currentPrincipal !== lastPrincipal.current) {
      lastPrincipal.current = currentPrincipal;
      connectionStartTime.current = 0;
      attemptCounter.current = 0;
      setElapsedTime(0);
      setConnectionPhase('Initializing');
      hasUsedTimeoutSafeguard.current = false;
      setIsPerformingSafeguardReset(false);
      
      // Increment session generation to invalidate in-flight attempts
      sessionGeneration.current += 1;
      
      // Clear elapsed time interval immediately
      if (elapsedTimeInterval.current) {
        clearInterval(elapsedTimeInterval.current);
        elapsedTimeInterval.current = null;
      }
      
      // Cancel existing connection queries
      queryClient.cancelQueries({ queryKey: ['backend-connection'] });
      
      // Trigger new connection
      setRetryTrigger((prev) => prev + 1);
    }
  }, [currentPrincipal, queryClient]);

  const connectionQuery = useQuery({
    queryKey: ['backend-connection', currentPrincipal, retryTrigger],
    queryFn: async () => {
      // Capture the current session generation at the start of this attempt
      const attemptSessionGeneration = sessionGeneration.current;
      
      // Helper to check if this attempt is still valid
      const isStale = () => attemptSessionGeneration !== sessionGeneration.current;
      
      // Track connection start time
      if (connectionStartTime.current === 0) {
        connectionStartTime.current = Date.now();
        attemptCounter.current = 0;
        
        // Start elapsed time tracking
        if (elapsedTimeInterval.current) {
          clearInterval(elapsedTimeInterval.current);
        }
        elapsedTimeInterval.current = setInterval(() => {
          if (!isStale()) {
            setElapsedTime(Date.now() - connectionStartTime.current);
          }
        }, 100);
      }

      // Only increment attempt counter if not stale
      if (!isStale()) {
        attemptCounter.current += 1;
      }
      const currentAttempt = attemptCounter.current;

      // Check if we've exceeded total connection time
      const elapsed = Date.now() - connectionStartTime.current;
      if (elapsed >= MAX_TOTAL_CONNECTION_TIME) {
        if (!isStale() && elapsedTimeInterval.current) {
          clearInterval(elapsedTimeInterval.current);
          elapsedTimeInterval.current = null;
        }
        
        // Log structured diagnostic
        if (import.meta.env.DEV && !isStale()) {
          console.error('[Connection Diagnostic]', {
            principal: currentPrincipal || 'anonymous',
            attempt: currentAttempt,
            elapsedMs: elapsed,
            category: 'timeout',
            message: 'Maximum connection time exceeded',
          });
        }
        
        throw new TimeoutError(
          `Connection exceeded maximum time of ${MAX_TOTAL_CONNECTION_TIME / 1000}s`,
          MAX_TOTAL_CONNECTION_TIME
        );
      }

      try {
        // Step 1: Create actor with timeout
        if (!isStale()) {
          setConnectionPhase('Creating session');
        }
        
        const actor = await withTimeout(
          (async () => {
            const isAuthenticated = !!identity;
            const actorOptions = isAuthenticated
              ? { agentOptions: { identity } }
              : undefined;

            const newActor = await createActorWithConfig(actorOptions);

            // Initialize access control if authenticated
            if (isAuthenticated) {
              try {
                const adminToken = getSecretParameter('caffeineAdminToken') || '';
                await newActor._initializeAccessControlWithSecret(adminToken);
              } catch (accessControlError: any) {
                // Log access control errors but don't fail the connection
                console.warn('Access control initialization warning:', accessControlError?.message || accessControlError);
                // If it's a critical auth error, rethrow
                if (accessControlError?.message?.toLowerCase().includes('unauthorized') ||
                    accessControlError?.message?.toLowerCase().includes('forbidden')) {
                  throw accessControlError;
                }
                // Otherwise continue - the backend may still be usable
              }
            }

            return newActor;
          })(),
          ACTOR_CREATION_TIMEOUT,
          'Actor creation timed out'
        );

        // Check if stale before proceeding
        if (isStale()) {
          throw new Error('Attempt superseded by newer connection');
        }

        // Step 2: Check readiness with timeout
        if (!isStale()) {
          setConnectionPhase('Checking readiness');
        }
        
        const isReady = await withTimeout(
          actor.isReady(),
          READINESS_CHECK_TIMEOUT,
          'Readiness check timed out'
        );

        // Check if stale before finalizing
        if (isStale()) {
          throw new Error('Attempt superseded by newer connection');
        }

        if (!isReady) {
          throw new Error('Backend reported not ready');
        }

        // Success - clear timers only if not stale
        if (!isStale()) {
          setConnectionPhase('Connected');
          if (elapsedTimeInterval.current) {
            clearInterval(elapsedTimeInterval.current);
            elapsedTimeInterval.current = null;
          }
        }

        return actor;
      } catch (error) {
        // Only process error if not stale
        if (!isStale()) {
          // Classify the error
          const classified = classifyError(error);
          
          // Log structured diagnostic
          if (import.meta.env.DEV) {
            const elapsed = Date.now() - connectionStartTime.current;
            console.error('[Connection Diagnostic]', {
              principal: currentPrincipal || 'anonymous',
              attempt: currentAttempt,
              elapsedMs: elapsed,
              category: classified.category,
              message: classified.message,
            });
          }
        }
        
        throw error;
      }
    },
    enabled: true,
    retry: (failureCount, error) => {
      // Capture session at retry decision time
      const retrySessionGeneration = sessionGeneration.current;
      
      // Check total elapsed time
      const elapsed = Date.now() - connectionStartTime.current;
      if (elapsed >= MAX_TOTAL_CONNECTION_TIME) {
        if (retrySessionGeneration === sessionGeneration.current) {
          setConnectionPhase('Connection failed');
          if (elapsedTimeInterval.current) {
            clearInterval(elapsedTimeInterval.current);
            elapsedTimeInterval.current = null;
          }
        }
        return false;
      }

      // Check retry count
      if (failureCount >= MAX_AUTO_RETRIES) {
        if (retrySessionGeneration === sessionGeneration.current) {
          setConnectionPhase('Connection failed');
          if (elapsedTimeInterval.current) {
            clearInterval(elapsedTimeInterval.current);
            elapsedTimeInterval.current = null;
          }
        }
        return false;
      }

      // Only retry retryable errors
      const classified = classifyError(error);
      
      // Don't retry stale/superseded attempts
      if (classified.category === 'connecting' && 
          (classified.message.toLowerCase().includes('superseded') || 
           classified.message.toLowerCase().includes('stale'))) {
        return false;
      }
      
      const shouldRetry = classified.shouldRetry && classified.category !== 'authorization';
      
      if (!shouldRetry && retrySessionGeneration === sessionGeneration.current) {
        setConnectionPhase('Connection failed');
        if (elapsedTimeInterval.current) {
          clearInterval(elapsedTimeInterval.current);
          elapsedTimeInterval.current = null;
        }
      }
      
      return shouldRetry;
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

  // Cleanup elapsed time interval on unmount
  useEffect(() => {
    return () => {
      if (elapsedTimeInterval.current) {
        clearInterval(elapsedTimeInterval.current);
        elapsedTimeInterval.current = null;
      }
    };
  }, []);

  // Determine connection status
  let status: ConnectionStatus = 'connecting';
  if (connectionQuery.isSuccess && connectionQuery.data) {
    status = 'ready';
  } else if (connectionQuery.isError) {
    status = 'failed';
  }

  const classified = connectionQuery.error ? classifyError(connectionQuery.error) : null;

  // Determine if we've given up (no more auto-retries)
  const elapsed = Date.now() - connectionStartTime.current;
  const hasGivenUp = connectionQuery.isError && (
    elapsed >= MAX_TOTAL_CONNECTION_TIME ||
    (connectionQuery.failureCount || 0) >= MAX_AUTO_RETRIES ||
    (classified?.category === 'authorization')
  );

  // Automatic timeout safeguard: perform one internal full reset on timeout failure
  useEffect(() => {
    const shouldTriggerSafeguard = 
      hasGivenUp &&
      !hasUsedTimeoutSafeguard.current &&
      !isPerformingSafeguardReset &&
      classified?.category === 'timeout';

    if (shouldTriggerSafeguard) {
      hasUsedTimeoutSafeguard.current = true;
      setIsPerformingSafeguardReset(true);
      
      // Perform automatic reset
      (async () => {
        try {
          // Increment session generation to invalidate any in-flight attempts
          sessionGeneration.current += 1;
          
          // Reset connection state
          connectionStartTime.current = Date.now();
          attemptCounter.current = 0;
          setElapsedTime(0);
          setConnectionPhase('Retrying automatically');

          // Clear any existing timers immediately
          if (elapsedTimeInterval.current) {
            clearInterval(elapsedTimeInterval.current);
            elapsedTimeInterval.current = null;
          }

          // Cancel any in-flight queries
          await queryClient.cancelQueries({ queryKey: ['backend-connection'] });
          
          // Remove the failed query from cache
          queryClient.removeQueries({ queryKey: ['backend-connection'] });

          // Trigger new connection attempt
          setRetryTrigger((prev) => prev + 1);

          // Wait a moment for the query to start
          await new Promise((resolve) => setTimeout(resolve, 100));
        } finally {
          setTimeout(() => {
            setIsPerformingSafeguardReset(false);
          }, 500);
        }
      })();
    }
  }, [hasGivenUp, classified?.category, isPerformingSafeguardReset, queryClient]);

  const retry = useCallback(async () => {
    if (isRetrying) return;

    setIsRetrying(true);
    try {
      // Increment session generation to invalidate any in-flight attempts
      sessionGeneration.current += 1;
      
      // Reset connection state including safeguard flag (manual retry gets a fresh chance)
      connectionStartTime.current = Date.now();
      attemptCounter.current = 0;
      setElapsedTime(0);
      setConnectionPhase('Retrying');
      hasUsedTimeoutSafeguard.current = false;

      // Clear any existing timers immediately
      if (elapsedTimeInterval.current) {
        clearInterval(elapsedTimeInterval.current);
        elapsedTimeInterval.current = null;
      }

      // Cancel any in-flight queries
      await queryClient.cancelQueries({ queryKey: ['backend-connection'] });
      
      // Remove the failed query from cache
      queryClient.removeQueries({ queryKey: ['backend-connection'] });

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

  // Adjust hasGivenUp to account for safeguard reset in progress
  const effectiveHasGivenUp = hasGivenUp && !isPerformingSafeguardReset;

  return {
    status: isPerformingSafeguardReset ? 'connecting' : status,
    actor: connectionQuery.data || null,
    isConnecting: status === 'connecting' || isPerformingSafeguardReset,
    isReady: status === 'ready' && !isPerformingSafeguardReset,
    isFailed: status === 'failed' && !isPerformingSafeguardReset,
    error: connectionQuery.error,
    errorMessage: classified?.userMessage || null,
    errorCategory: classified?.category || null,
    retry,
    isRetrying: isRetrying || isPerformingSafeguardReset,
    attemptNumber: attemptCounter.current,
    elapsedTime,
    connectionPhase: isPerformingSafeguardReset ? 'Retrying automatically' : connectionPhase,
    hasGivenUp: effectiveHasGivenUp,
  };
}
