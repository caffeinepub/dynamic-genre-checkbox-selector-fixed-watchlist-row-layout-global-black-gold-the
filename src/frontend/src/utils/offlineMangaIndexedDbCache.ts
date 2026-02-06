// IndexedDB-backed manga entry metadata cache with per-principal namespacing

import { MangaEntry } from '../backend';
import { getFromStore, putToStore, deleteFromStore } from './indexedDb';

const STORE_NAME = 'mangaMetadata';
const CACHE_VERSION = 1;

interface SerializableMangaEntry {
  stableId: string;
  title: string;
  alternateTitles: string[];
  genres: string[];
  coverImageUrls: string[];
  synopsis: string;
  chaptersRead: string;
  availableChapters: string;
  notes: string;
  bookmarks: string[];
  rating: number;
  completed: boolean;
  isBookmarked: boolean;
}

interface CachedMangaData {
  principal: string;
  version: number;
  timestamp: number;
  entries: SerializableMangaEntry[];
}

function serializeMangaEntry(entry: MangaEntry): SerializableMangaEntry {
  return {
    stableId: entry.stableId.toString(),
    title: entry.title,
    alternateTitles: entry.alternateTitles,
    genres: entry.genres,
    coverImageUrls: entry.coverImages.map(img => img.getDirectURL()),
    synopsis: entry.synopsis,
    chaptersRead: entry.chaptersRead.toString(),
    availableChapters: entry.availableChapters.toString(),
    notes: entry.notes,
    bookmarks: entry.bookmarks.map(b => b.toString()),
    rating: entry.rating,
    completed: entry.completed,
    isBookmarked: entry.isBookmarked,
  };
}

function deserializeMangaEntry(entry: SerializableMangaEntry): Partial<MangaEntry> {
  return {
    stableId: BigInt(entry.stableId),
    title: entry.title,
    alternateTitles: entry.alternateTitles,
    genres: entry.genres,
    synopsis: entry.synopsis,
    chaptersRead: parseFloat(entry.chaptersRead),
    availableChapters: parseFloat(entry.availableChapters),
    notes: entry.notes,
    bookmarks: entry.bookmarks.map(b => BigInt(b)),
    rating: entry.rating,
    completed: entry.completed,
    isBookmarked: entry.isBookmarked,
  };
}

/**
 * Write manga entries to IndexedDB for a specific principal
 */
export async function writeMangaIndexedDbCache(
  principal: string,
  entries: MangaEntry[]
): Promise<void> {
  try {
    const serialized = entries.map(serializeMangaEntry);
    const cacheData: CachedMangaData = {
      principal,
      version: CACHE_VERSION,
      timestamp: Date.now(),
      entries: serialized,
    };
    await putToStore(STORE_NAME, cacheData);
  } catch (error) {
    console.error('Failed to write manga IndexedDB cache:', error);
  }
}

/**
 * Read manga entries from IndexedDB for a specific principal
 */
export async function readMangaIndexedDbCache(
  principal: string
): Promise<Partial<MangaEntry>[] | null> {
  try {
    const cached = await getFromStore<CachedMangaData>(STORE_NAME, principal);
    if (!cached) return null;

    if (cached.version !== CACHE_VERSION) {
      await clearMangaIndexedDbCache(principal);
      return null;
    }

    return cached.entries.map(deserializeMangaEntry);
  } catch (error) {
    console.error('Failed to read manga IndexedDB cache:', error);
    return null;
  }
}

/**
 * Clear manga entries from IndexedDB for a specific principal
 */
export async function clearMangaIndexedDbCache(principal: string): Promise<void> {
  try {
    await deleteFromStore(STORE_NAME, principal);
  } catch (error) {
    console.error('Failed to clear manga IndexedDB cache:', error);
  }
}
