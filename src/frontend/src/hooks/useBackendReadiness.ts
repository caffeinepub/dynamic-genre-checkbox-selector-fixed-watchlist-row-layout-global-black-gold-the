import { useBackendConnectionSingleton } from './useBackendConnectionSingleton';

export type ReadinessStatus = 'idle' | 'connecting' | 'ready' | 'failed';

export interface BackendReadinessState {
  status: ReadinessStatus;
  isActorReady: boolean;
  isConnecting: boolean;
  isFailed: boolean;
  error: unknown | null;
  errorMessage: string | null;
  errorCategory: 'connecting' | 'transient' | 'authorization' | 'application' | 'timeout' | null;
  retry: () => void;
  retryCount: number;
}

/**
 * Hook that provides backend readiness state.
 * Now delegates to the singleton connection hook to prevent multiple connection loops.
 */
export function useBackendReadiness(): BackendReadinessState {
  const connection = useBackendConnectionSingleton();

  // Map connection status to readiness status
  let status: ReadinessStatus = 'idle';
  if (connection.isConnecting) {
    status = 'connecting';
  } else if (connection.isReady) {
    status = 'ready';
  } else if (connection.isFailed) {
    status = 'failed';
  }

  return {
    status,
    isActorReady: connection.isReady,
    isConnecting: connection.isConnecting,
    isFailed: connection.isFailed,
    error: connection.error,
    errorMessage: connection.errorMessage,
    errorCategory: connection.errorCategory,
    retry: connection.retry,
    retryCount: 0, // Connection hook manages retries internally
  };
}
