import { useQuery } from '@tanstack/react-query';
import { useBackendConnection } from './useBackendConnection';
import { useInternetIdentity } from './useInternetIdentity';
import { MangaEntry } from '../backend';
import { isRetryableError } from '../utils/backendErrorClassification';
import { writeMangaCache, readMangaCache } from '../utils/offlineMangaCache';
import { writeMangaIndexedDbCache, readMangaIndexedDbCache } from '../utils/offlineMangaIndexedDbCache';
import { ExternalBlob } from '../backend';
import { BACKEND_NOT_READY_MESSAGE } from '../utils/backendNotReadyMessage';

export function useGetAllMangaEntries() {
  const { actor, isReady, isConnecting } = useBackendConnection();
  const { identity } = useInternetIdentity();

  return useQuery<MangaEntry[]>({
    queryKey: ['allMangaEntries'],
    queryFn: async () => {
      if (!isReady || !actor) {
        throw new Error(BACKEND_NOT_READY_MESSAGE);
      }
      if (!identity) {
        throw new Error('Not authenticated');
      }
      
      const principal = identity.getPrincipal().toString();
      
      try {
        const entries = await actor.getAllEntriesWithStableIds();
        const mangaEntries = entries.map(([id, entry]) => ({
          ...entry,
          stableId: id,
        }));
        
        // Write to both caches on successful fetch
        writeMangaCache(mangaEntries);
        await writeMangaIndexedDbCache(principal, mangaEntries);
        
        return mangaEntries;
      } catch (error) {
        // Try IndexedDB cache first (per-principal)
        const indexedDbCached = await readMangaIndexedDbCache(principal);
        if (indexedDbCached && indexedDbCached.length > 0) {
          console.warn('Using IndexedDB cached manga data due to fetch error:', error);
          return indexedDbCached.map(entry => ({
            ...entry,
            coverImages: (entry as any).coverImageUrls?.map((url: string) => ExternalBlob.fromURL(url)) || [],
          })) as MangaEntry[];
        }
        
        // Fallback to legacy localStorage cache
        const localStorageCached = readMangaCache();
        if (localStorageCached && localStorageCached.length > 0) {
          console.warn('Using localStorage cached manga data due to fetch error:', error);
          return localStorageCached.map(entry => ({
            ...entry,
            coverImages: (entry as any).coverImageUrls?.map((url: string) => ExternalBlob.fromURL(url)) || [],
          })) as MangaEntry[];
        }
        
        throw error;
      }
    },
    enabled: isReady && !!identity && !!actor && !isConnecting,
    retry: (failureCount, error) => {
      if (failureCount >= 2) return false;
      return isRetryableError(error);
    },
    staleTime: 30000,
  });
}
