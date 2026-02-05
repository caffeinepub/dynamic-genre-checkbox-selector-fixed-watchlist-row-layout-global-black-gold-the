import { useQuery } from '@tanstack/react-query';
import { useBackendConnection } from './useBackendConnection';
import { useInternetIdentity } from './useInternetIdentity';
import { MangaEntry } from '../backend';
import { isRetryableError } from '../utils/backendErrorClassification';

export function useGetAllMangaEntries() {
  const { actor, isReady } = useBackendConnection();
  const { identity } = useInternetIdentity();

  return useQuery<MangaEntry[]>({
    queryKey: ['allMangaEntries'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated');
      return actor.getAllEntries();
    },
    // Gate on connection ready and authentication
    enabled: isReady && !!identity,
    retry: (failureCount, error) => {
      if (failureCount >= 2) return false;
      return isRetryableError(error);
    },
    staleTime: 30000,
  });
}
