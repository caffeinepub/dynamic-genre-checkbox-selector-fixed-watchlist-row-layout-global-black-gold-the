import { MangaEntry } from '../backend';

const CACHE_KEY = 'mangalist_offline_cache';
const CACHE_VERSION = 1;

interface CachedData {
  version: number;
  timestamp: number;
  entries: SerializableMangaEntry[];
}

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
    chaptersRead: BigInt(entry.chaptersRead),
    availableChapters: BigInt(entry.availableChapters),
    notes: entry.notes,
    bookmarks: entry.bookmarks.map(b => BigInt(b)),
    rating: entry.rating,
    completed: entry.completed,
    isBookmarked: entry.isBookmarked,
  };
}

/**
 * Legacy localStorage cache - kept for backwards compatibility
 */
export function writeMangaCache(entries: MangaEntry[]): void {
  try {
    const serialized = entries.map(serializeMangaEntry);
    const cacheData: CachedData = {
      version: CACHE_VERSION,
      timestamp: Date.now(),
      entries: serialized,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Failed to write manga cache:', error);
  }
}

export function readMangaCache(): Partial<MangaEntry>[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const cacheData: CachedData = JSON.parse(cached);
    if (cacheData.version !== CACHE_VERSION) {
      clearMangaCache();
      return null;
    }

    return cacheData.entries.map(deserializeMangaEntry);
  } catch (error) {
    console.error('Failed to read manga cache:', error);
    return null;
  }
}

export function clearMangaCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Failed to clear manga cache:', error);
  }
}
