import { useState, useEffect } from 'react';
import { getCachedCoverImage, fetchAndCacheCoverImage } from '../utils/offlineCoverImageIndexedDbCache';

/**
 * Hook that returns a cover image URL, preferring cached blob when available
 * Falls back to network URL while asynchronously fetching and caching
 */
export function useCachedCoverImageUrl(
  principal: string | undefined,
  stableId: bigint,
  networkUrl: string
): string {
  const [cachedUrl, setCachedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!principal) {
      setCachedUrl(null);
      return;
    }

    let objectUrl: string | null = null;
    let isMounted = true;

    async function loadCachedImage() {
      try {
        // Try to get cached blob
        const cachedBlob = await getCachedCoverImage(principal!, stableId, networkUrl);
        
        if (cachedBlob && isMounted) {
          objectUrl = URL.createObjectURL(cachedBlob);
          setCachedUrl(objectUrl);
        } else if (isMounted) {
          // Not cached, fetch and cache in background
          fetchAndCacheCoverImage(principal!, stableId, networkUrl).catch(err => {
            console.warn('Background cover fetch failed:', err);
          });
        }
      } catch (error) {
        console.error('Failed to load cached cover image:', error);
      }
    }

    loadCachedImage();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [principal, stableId, networkUrl]);

  // Return cached URL if available, otherwise network URL
  return cachedUrl || networkUrl;
}
