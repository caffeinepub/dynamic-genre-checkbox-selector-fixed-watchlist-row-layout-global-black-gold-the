import { useMemo } from 'react';
import { useGetAllMangaEntries } from './useAllMangaEntries';

export function useLibraryGenres() {
  const { data: allEntries, isLoading } = useGetAllMangaEntries();

  const genres = useMemo(() => {
    if (!allEntries || allEntries.length === 0) return [];
    
    const genreSet = new Set<string>();
    allEntries.forEach(entry => {
      entry.genres.forEach(genre => {
        const normalized = genre.trim();
        if (normalized) {
          genreSet.add(normalized);
        }
      });
    });
    
    return Array.from(genreSet).sort((a, b) => a.localeCompare(b));
  }, [allEntries]);

  return { genres, isLoading };
}
