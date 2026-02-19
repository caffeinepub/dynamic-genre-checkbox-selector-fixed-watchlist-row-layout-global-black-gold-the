import { useState, useMemo, useCallback, useEffect } from 'react';
import { useGetAllMangaEntries } from '../../hooks/useAllMangaEntries';
import { useActorWithRetry } from '../../hooks/useActorWithRetry';
import { useLibraryGenres } from '../../hooks/useLibraryGenres';
import { useUniformWatchlistRowWidth } from '../../hooks/useUniformWatchlistRowWidth';
import { AddMangaDialog } from './AddMangaDialog';
import { PaginationControls } from './PaginationControls';
import { MangaRowActions } from './MangaRowActions';
import { FloatingControlsPanel } from './FloatingControlsPanel';
import { Button } from '../ui/button';
import { BookOpen, AlertCircle, Loader2, RefreshCw, WifiOff, RotateCw } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription } from '../ui/alert';

const ENTRIES_PER_PAGE = 30;
const MIN_ROW_WIDTH = 925;

export function MangaListPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [watchlistAlignment, setWatchlistAlignment] = useState<'left' | 'center' | 'right'>('center');
  
  const [titleSearch, setTitleSearch] = useState('');
  const [synopsisSearch, setSynopsisSearch] = useState('');
  const [notesSearch, setNotesSearch] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [completedOnly, setCompletedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'title-asc' | 'title-desc' | 'rating-desc' | 'rating-asc'>('title-asc');
  
  const { 
    isConnecting, 
    isError: actorError, 
    errorMessage: actorErrorMessage, 
    errorCategory,
    retry: retryActor,
    isRetrying,
    isActorReady,
    readinessStatus,
    elapsedTime,
    connectionPhase,
    hasGivenUp,
    retryCount,
  } = useActorWithRetry();
  
  const { data: allEntries, isLoading, error: dataError } = useGetAllMangaEntries();
  const { genres: availableGenres } = useLibraryGenres();

  const isOfflineMode = dataError && allEntries && allEntries.length > 0;

  // Auto-prune selectedGenres when availableGenres changes
  useEffect(() => {
    setSelectedGenres(prev => {
      const validGenres = prev.filter(g => availableGenres.includes(g));
      // Only update if something changed to avoid unnecessary re-renders
      if (validGenres.length !== prev.length) {
        return validGenres;
      }
      return prev;
    });
  }, [availableGenres]);

  // Format elapsed time for display
  const formatElapsedTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    return `${seconds}s`;
  };

  const filteredAndSortedEntries = useMemo(() => {
    if (!allEntries) return [];

    let filtered = [...allEntries];

    if (titleSearch.trim()) {
      const searchLower = titleSearch.toLowerCase();
      filtered = filtered.filter(entry => {
        // Search in primary title
        if (entry.title.toLowerCase().includes(searchLower)) {
          return true;
        }
        // Search in alternate titles
        return entry.alternateTitles.some(altTitle => 
          altTitle.toLowerCase().includes(searchLower)
        );
      });
    }

    if (synopsisSearch.trim()) {
      const searchLower = synopsisSearch.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.synopsis.toLowerCase().includes(searchLower)
      );
    }

    if (notesSearch.trim()) {
      const searchLower = notesSearch.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.notes.toLowerCase().includes(searchLower)
      );
    }

    if (selectedGenres.length > 0) {
      filtered = filtered.filter(entry =>
        entry.genres.some(genre => selectedGenres.includes(genre))
      );
    }

    if (bookmarkedOnly) {
      filtered = filtered.filter(entry => entry.isBookmarked);
    }

    if (completedOnly) {
      filtered = filtered.filter(entry => entry.completed);
    }

    if (sortBy === 'title-asc') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'title-desc') {
      filtered.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortBy === 'rating-desc') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'rating-asc') {
      filtered.sort((a, b) => a.rating - b.rating);
    }

    return filtered;
  }, [allEntries, titleSearch, synopsisSearch, notesSearch, selectedGenres, bookmarkedOnly, completedOnly, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedEntries.length / ENTRIES_PER_PAGE));
  
  const safePage = Math.min(currentPage, totalPages);
  if (safePage !== currentPage && filteredAndSortedEntries.length > 0) {
    setCurrentPage(safePage);
  }

  const paginatedEntries = useMemo(() => {
    const start = (safePage - 1) * ENTRIES_PER_PAGE;
    const end = start + ENTRIES_PER_PAGE;
    return filteredAndSortedEntries.slice(start, end);
  }, [filteredAndSortedEntries, safePage]);

  // Use uniform width hook
  const { uniformWidth, registerRow } = useUniformWatchlistRowWidth([
    paginatedEntries.length,
    currentPage,
    titleSearch,
    synopsisSearch,
    notesSearch,
    selectedGenres,
    bookmarkedOnly,
    completedOnly,
    sortBy,
  ]);

  // Clamp to minimum 925px
  const finalRowWidth = Math.max(uniformWidth ?? 0, MIN_ROW_WIDTH);

  const handlePageChange = useCallback((newPage: number) => {
    if (!isActorReady) {
      return;
    }
    // Additional clamping at the handler level for defense in depth
    const clampedPage = Math.max(1, Math.min(newPage, totalPages));
    setCurrentPage(clampedPage);
  }, [isActorReady, totalPages]);

  const handleAddManga = useCallback(() => {
    setIsAddDialogOpen(true);
  }, []);

  // Show connecting state only when actually connecting and no terminal error
  if (isConnecting && (!actorError || !hasGivenUp)) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-muted-foreground mt-1">
              Connecting to backend...
            </p>
          </div>
        </div>
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-medium mb-1">
                  {connectionPhase} {retryCount > 0 && `(Attempt ${retryCount})`}
                </div>
                <div className="text-sm text-muted-foreground">
                  Elapsed: {formatElapsedTime(elapsedTime)} • Max: 45s
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>
        <div className="flex flex-col items-center gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[78px] w-full max-w-[925px]" />
          ))}
        </div>
      </div>
    );
  }

  // Show connection error state only when terminal (given up)
  if (actorError && hasGivenUp && !isActorReady) {
    const isAuthError = errorCategory === 'authorization';
    const isTimeout = errorCategory === 'timeout';
    const isTransient = errorCategory === 'transient' || errorCategory === 'connecting' || isTimeout;

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-muted-foreground mt-1">
              {isAuthError 
                ? 'Authorization required' 
                : isTimeout 
                ? 'Connection timed out' 
                : 'Connection issue detected'}
            </p>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between gap-2">
            <div className="flex-1">
              <div className="font-medium mb-1">
                {actorErrorMessage || 
                 (isTimeout ? 'Connection timed out' : 
                  isTransient ? 'Connection issue detected' :
                  'Unable to connect to the backend')}
              </div>
              <div className="text-sm text-muted-foreground">
                Maximum retry attempts reached. Please try manually.
              </div>
            </div>
            {isTransient && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={retryActor}
                disabled={isRetrying}
                className="shrink-0"
              >
                {isRetrying ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </>
                )}
              </Button>
            )}
          </AlertDescription>
        </Alert>
        <div className="text-center py-16 border-2 border-dashed border-border rounded-lg">
          <AlertCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {isAuthError 
              ? 'Authorization Required' 
              : isTimeout 
              ? 'Connection Timed Out' 
              : 'Connection Error'}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {isAuthError 
              ? 'You need to be logged in to access your manga collection.'
              : 'The connection attempt took too long and all automatic retries have been exhausted. You can retry manually or reload the page.'}
          </p>
          <div className="flex gap-3 justify-center">
            {isTransient && (
              <Button onClick={retryActor} variant="default" disabled={isRetrying}>
                {isRetrying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry Connection
                  </>
                )}
              </Button>
            )}
            <Button onClick={() => window.location.reload()} variant="outline">
              <RotateCw className="h-4 w-4 mr-2" />
              Reload Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show data fetch error (only if not offline mode and actor is ready)
  if (dataError && !isOfflineMode && isActorReady) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
        <p className="text-destructive mb-4">Error loading manga list. Please try again.</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reload Page
        </Button>
      </div>
    );
  }

  // Show loading state
  if (isLoading && !allEntries) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex flex-col items-center gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[78px] w-full max-w-[925px]" />
          ))}
        </div>
      </div>
    );
  }

  const hasFilters = titleSearch || synopsisSearch || notesSearch || selectedGenres.length > 0 || bookmarkedOnly || completedOnly;

  const alignmentClass = 
    watchlistAlignment === 'left' ? 'items-start' :
    watchlistAlignment === 'right' ? 'items-end' :
    'items-center';

  return (
    <div className="space-y-6">
      {isOfflineMode && (
        <Alert>
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            Offline mode: Showing cached data from your last sync. Some features may be unavailable.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-muted-foreground mt-1">
            {filteredAndSortedEntries.length === 0 
              ? hasFilters 
                ? 'No manga match your filters' 
                : 'Start building your collection'
              : `${filteredAndSortedEntries.length} manga ${hasFilters ? 'found' : 'total'}`}
          </p>
        </div>
      </div>

      {(allEntries && allEntries.length > 0) && (
        <FloatingControlsPanel
          titleSearch={titleSearch}
          onTitleSearchChange={setTitleSearch}
          synopsisSearch={synopsisSearch}
          onSynopsisSearchChange={setSynopsisSearch}
          notesSearch={notesSearch}
          onNotesSearchChange={setNotesSearch}
          selectedGenres={selectedGenres}
          onSelectedGenresChange={setSelectedGenres}
          availableGenres={availableGenres}
          bookmarkedOnly={bookmarkedOnly}
          onBookmarkedOnlyChange={setBookmarkedOnly}
          completedOnly={completedOnly}
          onCompletedOnlyChange={setCompletedOnly}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          onAddManga={handleAddManga}
          isBackendReady={isActorReady}
          watchlistAlignment={watchlistAlignment}
          onWatchlistAlignmentChange={setWatchlistAlignment}
        />
      )}

      {filteredAndSortedEntries.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-lg">
          <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {hasFilters ? 'No manga found' : 'No manga yet'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {hasFilters 
              ? 'Try adjusting your search or filters'
              : 'Start by adding your first manga to your watchlist'}
          </p>
          {!hasFilters && (
            <Button 
              onClick={handleAddManga} 
              className="gap-2"
              disabled={!isActorReady}
            >
              Add Your First Manga
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className={`flex flex-col ${alignmentClass} gap-4 overflow-x-auto pb-4`}>
            {paginatedEntries.map((manga) => (
              <div 
                key={manga.stableId.toString()}
                ref={registerRow}
                style={{ 
                  width: `${finalRowWidth}px`, 
                  minWidth: `${finalRowWidth}px` 
                }}
              >
                <MangaRowActions 
                  manga={manga}
                  currentPage={currentPage}
                  isBackendReady={isActorReady}
                />
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <PaginationControls
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              disabled={!isActorReady}
            />
          )}
        </>
      )}

      {/* Only mount AddMangaDialog when open */}
      {isAddDialogOpen && (
        <AddMangaDialog 
          open={isAddDialogOpen} 
          onOpenChange={setIsAddDialogOpen}
          currentPage={currentPage}
        />
      )}
    </div>
  );
}
