import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { MangaEntry } from '../backend';

export function useGetAllMangaEntries() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<MangaEntry[]>({
    queryKey: ['allMangaEntries'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAllEntries();
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });
}
