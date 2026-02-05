import { useQuery } from '@tanstack/react-query';
import { useBackendConnection } from './useBackendConnection';
import { useInternetIdentity } from './useInternetIdentity';
import { MangaPage } from '../backend';
import { isRetryableError } from '../utils/backendErrorClassification';

export function useGetMangaPage(pageNumber: number) {
  const { actor, isReady } = useBackendConnection();
  const { identity } = useInternetIdentity();

  return useQuery<MangaPage>({
    queryKey: ['mangaPage', pageNumber],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated');
      return actor.getMangaPage(BigInt(pageNumber));
    },
    // Gate on connection ready and authentication
    enabled: isReady && !!identity,
    retry: (failureCount, error) => {
      // Don't retry application-level errors or after 2 attempts
      if (failureCount >= 2) return false;
      return isRetryableError(error);
    },
    staleTime: 10000,
  });
}
