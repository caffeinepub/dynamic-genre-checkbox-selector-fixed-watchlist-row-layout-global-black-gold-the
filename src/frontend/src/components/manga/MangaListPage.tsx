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
import { BookOpen, AlertCircle, Loader2, RefreshCw, WifiOff } from 'lucide-react';
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
  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * ENTRIES_PER_PAGE;
    return filteredAndSortedEntries.slice(startIndex, startIndex + ENTRIES_PER_PAGE);
  }, [filteredAndSortedEntries, currentPage]);

  const handlePageChange = useCallback((page: number) => {
    const clampedPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(clampedPage);
  }, [totalPages]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const { uniformWidth, registerRow } = useUniformWatchlistRowWidth([currentPage, filteredAndSortedEntries.length]);

  const alignmentClass = useMemo(() => {
    if (watchlistAlignment === 'left') return 'justify-start';
    if (watchlistAlignment === 'right') return 'justify-end';
    return 'justify-center';
  }, [watchlistAlignment]);

  const handleAddDialogOpenChange = useCallback((open: boolean) => {
    setIsAddDialogOpen(open);
  }, []);

  const handleTitleSearchChange = useCallback((value: string) => {
    setTitleSearch(value);
    setCurrentPage(1);
  }, []);

  const handleSynopsisSearchChange = useCallback((value: string) => {
    setSynopsisSearch(value);
    setCurrentPage(1);
  }, []);

  const handleNotesSearchChange = useCallback((value: string) => {
    setNotesSearch(value);
    setCurrentPage(1);
  }, []);

  const handleGenresChange = useCallback((genres: string[]) => {
    setSelectedGenres(genres);
    setCurrentPage(1);
  }, []);

  const handleBookmarkedOnlyChange = useCallback((value: boolean) => {
    setBookmarkedOnly(value);
    setCurrentPage(1);
  }, []);

  const handleCompletedOnlyChange = useCallback((value: boolean) => {
    setCompletedOnly(value);
    setCurrentPage(1);
  }, []);

  const handleSortByChange = useCallback((value: 'title-asc' | 'title-desc' | 'rating-desc' | 'rating-asc') => {
    setSortBy(value);
  }, []);

  const handleWatchlistAlignmentChange = useCallback((value: 'left' | 'center' | 'right') => {
    setWatchlistAlignment(value);
  }, []);

  // Show terminal error state when backend has given up
  if (hasGivenUp && actorError) {
    return (
      <div className="space-y-6 bg-background text-foreground">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-3">
            <div>
              <strong>Unable to connect to backend</strong>
              <p className="mt-1">{actorErrorMessage}</p>
              {errorCategory && (
                <p className="text-xs mt-1 opacity-80">Error type: {errorCategory}</p>
              )}
            </div>
            <Button
              onClick={retryActor}
              disabled={isRetrying}
              variant="outline"
              size="sm"
              className="w-fit"
            >
              {isRetrying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry Connection
                </>
              )}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show connecting state
  if (isConnecting) {
    return (
      <div className="space-y-6 bg-background text-foreground">
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {connectionPhase === 'initializing' && 'Initializing connection...'}
                {connectionPhase === 'connecting' && 'Connecting to backend...'}
                {connectionPhase === 'verifying' && 'Verifying connection...'}
                {connectionPhase === 'retrying' && `Retrying connection (attempt ${retryCount})...`}
              </p>
              {elapsedTime > 0 && (
                <p className="text-xs text-muted-foreground/70">
                  Elapsed: {formatElapsedTime(elapsedTime)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state for data
  if (isLoading) {
    return (
      <div className="space-y-6 bg-background text-foreground">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Show offline mode banner if applicable
  const offlineBanner = isOfflineMode && (
    <Alert className="mb-4">
      <WifiOff className="h-4 w-4" />
      <AlertDescription>
        <strong>Offline Mode:</strong> Showing cached data. Some features may be unavailable.
      </AlertDescription>
    </Alert>
  );

  // Show empty state
  if (!allEntries || allEntries.length === 0) {
    return (
      <div className="space-y-6 bg-background text-foreground">
        {offlineBanner}
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2 text-foreground">No manga entries yet</h2>
          <p className="text-muted-foreground mb-6">Start building your watchlist by adding your first manga.</p>
          <AddMangaDialog open={isAddDialogOpen} onOpenChange={handleAddDialogOpenChange} currentPage={currentPage} />
        </div>
      </div>
    );
  }

  // Show no results state
  if (filteredAndSortedEntries.length === 0) {
    return (
      <div className="space-y-6 bg-background text-foreground">
        {offlineBanner}
        <FloatingControlsPanel
          titleSearch={titleSearch}
          onTitleSearchChange={handleTitleSearchChange}
          synopsisSearch={synopsisSearch}
          onSynopsisSearchChange={handleSynopsisSearchChange}
          notesSearch={notesSearch}
          onNotesSearchChange={handleNotesSearchChange}
          selectedGenres={selectedGenres}
          onSelectedGenresChange={handleGenresChange}
          availableGenres={availableGenres}
          bookmarkedOnly={bookmarkedOnly}
          onBookmarkedOnlyChange={handleBookmarkedOnlyChange}
          completedOnly={completedOnly}
          onCompletedOnlyChange={handleCompletedOnlyChange}
          sortBy={sortBy}
          onSortByChange={handleSortByChange}
          watchlistAlignment={watchlistAlignment}
          onWatchlistAlignmentChange={handleWatchlistAlignmentChange}
          onAddManga={() => setIsAddDialogOpen(true)}
          isBackendReady={isActorReady}
        />
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2 text-foreground">No results found</h2>
          <p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
        </div>
        <AddMangaDialog open={isAddDialogOpen} onOpenChange={handleAddDialogOpenChange} currentPage={currentPage} />
      </div>
    );
  }

  // Main content
  return (
    <div className="space-y-6 bg-background text-foreground">
      {offlineBanner}
      
      <FloatingControlsPanel
        titleSearch={titleSearch}
        onTitleSearchChange={handleTitleSearchChange}
        synopsisSearch={synopsisSearch}
        onSynopsisSearchChange={handleSynopsisSearchChange}
        notesSearch={notesSearch}
        onNotesSearchChange={handleNotesSearchChange}
        selectedGenres={selectedGenres}
        onSelectedGenresChange={handleGenresChange}
        availableGenres={availableGenres}
        bookmarkedOnly={bookmarkedOnly}
        onBookmarkedOnlyChange={handleBookmarkedOnlyChange}
        completedOnly={completedOnly}
        onCompletedOnlyChange={handleCompletedOnlyChange}
        sortBy={sortBy}
        onSortByChange={handleSortByChange}
        watchlistAlignment={watchlistAlignment}
        onWatchlistAlignmentChange={handleWatchlistAlignmentChange}
        onAddManga={() => setIsAddDialogOpen(true)}
        isBackendReady={isActorReady}
      />

      <div className={`flex flex-col gap-4 ${alignmentClass}`}>
        {paginatedEntries.map((entry) => (
          <div
            key={entry.stableId.toString()}
            ref={registerRow}
            style={{
              minWidth: `${MIN_ROW_WIDTH}px`,
              width: uniformWidth ? `${uniformWidth}px` : 'auto',
            }}
          >
            <MangaRowActions manga={entry} currentPage={currentPage} isBackendReady={isActorReady} />
          </div>
        ))}
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      <AddMangaDialog open={isAddDialogOpen} onOpenChange={handleAddDialogOpenChange} currentPage={currentPage} />
    </div>
  );
}
