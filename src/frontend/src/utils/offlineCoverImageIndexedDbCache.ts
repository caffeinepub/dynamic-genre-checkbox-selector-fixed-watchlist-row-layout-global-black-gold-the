// IndexedDB blob cache for cover images keyed by principal + manga stableId + cover URL

import { getFromStore, putToStore, deleteFromStore, getAllKeysFromStore } from './indexedDb';

const STORE_NAME = 'coverImages';

interface CachedCoverImage {
  key: string; // Format: "principal:stableId:urlHash"
  blob: Blob;
  timestamp: number;
}

/**
 * Generate a cache key for a cover image
 */
function generateCoverKey(principal: string, stableId: bigint, coverUrl: string): string {
  // Simple hash of the URL to keep key manageable
  const urlHash = coverUrl.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0).toString(36);
  return `${principal}:${stableId.toString()}:${urlHash}`;
}

/**
 * Get cached cover image blob
 */
export async function getCachedCoverImage(
  principal: string,
  stableId: bigint,
  coverUrl: string
): Promise<Blob | null> {
  try {
    const key = generateCoverKey(principal, stableId, coverUrl);
    const cached = await getFromStore<CachedCoverImage>(STORE_NAME, key);
    return cached?.blob || null;
  } catch (error) {
    console.error('Failed to get cached cover image:', error);
    return null;
  }
}

/**
 * Store cover image blob in cache
 */
export async function storeCoverImage(
  principal: string,
  stableId: bigint,
  coverUrl: string,
  blob: Blob
): Promise<void> {
  try {
    const key = generateCoverKey(principal, stableId, coverUrl);
    const cacheData: CachedCoverImage = {
      key,
      blob,
      timestamp: Date.now(),
    };
    await putToStore(STORE_NAME, cacheData);
  } catch (error) {
    console.error('Failed to store cover image:', error);
  }
}

/**
 * Fetch and cache a cover image from URL
 */
export async function fetchAndCacheCoverImage(
  principal: string,
  stableId: bigint,
  coverUrl: string
): Promise<Blob | null> {
  try {
    const response = await fetch(coverUrl);
    if (!response.ok) {
      console.warn(`Failed to fetch cover image: ${response.status}`);
      return null;
    }
    const blob = await response.blob();
    await storeCoverImage(principal, stableId, coverUrl, blob);
    return blob;
  } catch (error) {
    console.error('Failed to fetch and cache cover image:', error);
    return null;
  }
}

/**
 * Clear all cover images for a specific principal
 */
export async function clearCoverImagesForPrincipal(principal: string): Promise<void> {
  try {
    const allKeys = await getAllKeysFromStore(STORE_NAME);
    const principalPrefix = `${principal}:`;
    const keysToDelete = allKeys.filter(key => key.startsWith(principalPrefix));
    
    await Promise.all(keysToDelete.map(key => deleteFromStore(STORE_NAME, key)));
  } catch (error) {
    console.error('Failed to clear cover images for principal:', error);
  }
}
