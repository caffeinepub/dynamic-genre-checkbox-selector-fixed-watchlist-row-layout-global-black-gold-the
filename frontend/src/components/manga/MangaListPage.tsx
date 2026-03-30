import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useGetAllMangaEntries } from '../../hooks/useAllMangaEntries';
import { useLibraryGenres } from '../../hooks/useLibraryGenres';
import MangaRowActions from './MangaRowActions';
import FloatingControlsPanel from './FloatingControlsPanel';
import PaginationControls from './PaginationControls';
import AddMangaDialog from './AddMangaDialog';
import { useUniformWatchlistRowWidth } from '../../hooks/useUniformWatchlistRowWidth';
import { Loader2 } from 'lucide-react';

const ITEMS_PER_PAGE = 30;

type SortOption =
  | 'title-asc'
  | 'title-desc'
  | 'rating-asc'
  | 'rating-desc'
  | 'chapters-asc'
  | 'chapters-desc';

type CompletionFilter = 'all' | 'complete' | 'incomplete';

export default function MangaListPage() {
  const { data: allEntries = [], isLoading, isError, error } = useGetAllMangaEntries();
  const { genres: libraryGenres } = useLibraryGenres();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('title-asc');
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const [completionFilter, setCompletionFilter] = useState<CompletionFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [alignment, setAlignment] = useState<'left' | 'center'>('left');

  // useUniformWatchlistRowWidth takes a dependencies array
  const { uniformWidth, registerRow } = useUniformWatchlistRowWidth([currentPage, searchQuery, selectedGenres, sortOption]);

  // Auto-prune invalid genre selections
  useEffect(() => {
    if (libraryGenres.length > 0 && selectedGenres.length > 0) {
      const validGenres = selectedGenres.filter((g) => libraryGenres.includes(g));
      if (validGenres.length !== selectedGenres.length) {
        setSelectedGenres(validGenres);
      }
    }
  }, [libraryGenres, selectedGenres]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedGenres, sortOption, showBookmarkedOnly, completionFilter]);

  const filteredAndSorted = React.useMemo(() => {
    let entries = [...allEntries];

    // Search filter (title + alternate titles)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      entries = entries.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.alternateTitles.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Genre filter
    if (selectedGenres.length > 0) {
      entries = entries.filter((e) =>
        selectedGenres.every((g) => e.genres.includes(g))
      );
    }

    // Bookmark filter
    if (showBookmarkedOnly) {
      entries = entries.filter((e) => e.isBookmarked);
    }

    // Completion filter
    if (completionFilter === 'complete') {
      entries = entries.filter((e) => e.completed);
    } else if (completionFilter === 'incomplete') {
      entries = entries.filter((e) => !e.completed);
    }

    // Sort
    entries.sort((a, b) => {
      switch (sortOption) {
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'rating-asc':
          return a.rating - b.rating;
        case 'rating-desc':
          return b.rating - a.rating;
        case 'chapters-asc':
          return a.chaptersRead - b.chaptersRead;
        case 'chapters-desc':
          return b.chaptersRead - a.chaptersRead;
        default:
          return a.title.localeCompare(b.title);
      }
    });

    return entries;
  }, [allEntries, searchQuery, selectedGenres, sortOption, showBookmarkedOnly, completionFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE));
  const clampedPage = Math.min(currentPage, totalPages);
  const paginatedEntries = filteredAndSorted.slice(
    (clampedPage - 1) * ITEMS_PER_PAGE,
    clampedPage * ITEMS_PER_PAGE
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (isLoading) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] gap-4"
        style={{ backgroundColor: '#000000' }}
      >
        <Loader2 className="animate-spin" style={{ color: '#d4a017' }} size={40} />
        <p style={{ color: '#8a6a10' }}>Loading your manga collection...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] gap-4"
        style={{ backgroundColor: '#000000' }}
      >
        <p className="text-lg font-serif" style={{ color: '#d4a017' }}>
          Failed to load manga entries
        </p>
        <p className="text-sm" style={{ color: '#8a6a10' }}>
          {error instanceof Error ? error.message : 'Unknown error occurred'}
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: '#000000' }}
    >
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Floating Controls */}
        <FloatingControlsPanel
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedGenres={selectedGenres}
          onGenresChange={setSelectedGenres}
          availableGenres={libraryGenres}
          sortOption={sortOption}
          onSortChange={(v) => setSortOption(v as SortOption)}
          showBookmarkedOnly={showBookmarkedOnly}
          onBookmarkToggle={() => setShowBookmarkedOnly((p) => !p)}
          completionFilter={completionFilter}
          onCompletionFilterChange={(v) => setCompletionFilter(v as CompletionFilter)}
          alignment={alignment}
          onAlignmentChange={setAlignment}
          onAddManga={() => setAddDialogOpen(true)}
          totalCount={filteredAndSorted.length}
        />

        {/* Entry count */}
        <div className="mb-3 mt-2">
          <span className="text-sm font-serif" style={{ color: '#8a6a10' }}>
            {filteredAndSorted.length} {filteredAndSorted.length === 1 ? 'entry' : 'entries'}
            {filteredAndSorted.length !== allEntries.length && ` (filtered from ${allEntries.length})`}
          </span>
        </div>

        {/* Manga List */}
        <div
          className="space-y-2"
          style={{
            minWidth: '925px',
            overflowX: 'auto',
          }}
        >
          {paginatedEntries.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 gap-4"
              style={{
                border: '1px solid #d4a017',
                backgroundColor: '#0a0a0a',
              }}
            >
              <p className="text-lg font-serif" style={{ color: '#d4a017' }}>
                {allEntries.length === 0
                  ? 'Your watchlist is empty'
                  : 'No entries match your filters'}
              </p>
              {allEntries.length === 0 && (
                <button
                  onClick={() => setAddDialogOpen(true)}
                  className="px-6 py-2 border font-serif text-sm transition-all"
                  style={{
                    borderColor: '#d4a017',
                    color: '#d4a017',
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(212,160,23,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                  }}
                >
                  Add Your First Manga
                </button>
              )}
            </div>
          ) : (
            paginatedEntries.map((entry) => (
              <MangaRowActions
                key={entry.stableId.toString()}
                entry={entry}
                uniformWidth={uniformWidth}
                registerRow={registerRow}
                alignment={alignment}
                currentPage={clampedPage}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6">
            <PaginationControls
              currentPage={clampedPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      {/* Add Manga Dialog */}
      <AddMangaDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        currentPage={clampedPage}
      />
    </div>
  );
}
