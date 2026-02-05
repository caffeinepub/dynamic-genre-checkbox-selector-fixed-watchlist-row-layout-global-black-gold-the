import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { useBackendReadiness } from './useBackendReadiness';
import { MangaEntry } from '../backend';
import { isRetryableError } from '../utils/backendErrorClassification';

export function useGetAllMangaEntries() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const { isActorReady } = useBackendReadiness();

  return useQuery<MangaEntry[]>({
    queryKey: ['allMangaEntries'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated');
      return actor.getAllEntries();
    },
    // Triple gate: actor exists, actor is ready, user is authenticated
    enabled: !!actor && !actorFetching && isActorReady && !!identity,
    retry: (failureCount, error) => {
      // Don't retry application-level errors
      if (failureCount >= 2) return false;
      return isRetryableError(error);
    },
    staleTime: 30000,
  });
}
