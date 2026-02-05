import { useBackendConnectionContext } from '../context/BackendConnectionContext';

/**
 * Hook that provides access to the singleton backend connection state.
 * This ensures only one connection attempt loop is active at a time.
 * 
 * Must be used within BackendConnectionProvider.
 */
export function useBackendConnectionSingleton() {
  return useBackendConnectionContext();
}
