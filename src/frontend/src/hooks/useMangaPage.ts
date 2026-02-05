import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { MangaPage } from '../backend';

export function useGetMangaPage(pageNumber: number) {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<MangaPage>({
    queryKey: ['mangaPage', pageNumber],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getMangaPage(BigInt(pageNumber));
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });
}
