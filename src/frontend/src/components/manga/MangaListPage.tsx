import { useState, useMemo } from 'react';
import { useGetAllMangaEntries } from '../../hooks/useAllMangaEntries';
import { useActorWithRetry } from '../../hooks/useActorWithRetry';
import { useLibraryGenres } from '../../hooks/useLibraryGenres';
import { AddMangaDialog } from './AddMangaDialog';
import { PaginationControls } from './PaginationControls';
import { MangaCard } from './MangaCard';
import { MangaListControls } from './MangaListControls';
import { Button } from '../ui/button';
import { Plus, BookOpen, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription } from '../ui/alert';
import { MangaEntry } from '../../backend';

const ENTRIES_PER_PAGE = 30;

export function MangaListPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Search/filter/sort state
  const [titleSearch, setTitleSearch] = useState('');
  const [synopsisSearch, setSynopsisSearch] = useState('');
  const [notesSearch, setNotesSearch] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'title' | 'rating'>('title');
  
  const { 
    isConnecting, 
    isError: actorError, 
    errorMessage: actorErrorMessage, 
    errorCategory,
    retry: retryActor,
    isRetrying,
    isActorReady,
    readinessStatus,
  } = useActorWithRetry();
  
  const { data: allEntries, isLoading, error } = useGetAllMangaEntries();
  const { genres: availableGenres } = useLibraryGenres();

  // Apply filters and sorting
  const filteredAndSortedEntries = useMemo(() => {
    if (!allEntries) return [];

    let filtered = [...allEntries];

    // Apply title search
    if (titleSearch.trim()) {
      const searchLower = titleSearch.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.title.toLowerCase().includes(searchLower)
      );
    }

    // Apply synopsis search
    if (synopsisSearch.trim()) {
      const searchLower = synopsisSearch.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.synopsis.toLowerCase().includes(searchLower)
      );
    }

    // Apply notes search
    if (notesSearch.trim()) {
      const searchLower = notesSearch.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.notes.toLowerCase().includes(searchLower)
      );
    }

    // Apply genre filter
    if (selectedGenres.length > 0) {
      filtered = filtered.filter(entry =>
        entry.genres.some(genre => selectedGenres.includes(genre))
      );
    }

    // Apply bookmarked filter
    if (bookmarkedOnly) {
      filtered = filtered.filter(entry => entry.bookmarks.length > 0);
    }

    // Apply sorting
    if (sortBy === 'title') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    }

    return filtered;
  }, [allEntries, titleSearch, synopsisSearch, notesSearch, selectedGenres, bookmarkedOnly, sortBy]);

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedEntries.length / ENTRIES_PER_PAGE));
  
  // Clamp current page when filters reduce total pages
  const safePage = Math.min(currentPage, totalPages);
  if (safePage !== currentPage && filteredAndSortedEntries.length > 0) {
    setCurrentPage(safePage);
  }

  const paginatedEntries = useMemo(() => {
    const start = (safePage - 1) * ENTRIES_PER_PAGE;
    const end = start + ENTRIES_PER_PAGE;
    return filteredAndSortedEntries.slice(start, end);
  }, [filteredAndSortedEntries, safePage]);

  // Show connecting/initializing state with timeout awareness
  if (isConnecting && !actorError) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">My Manga Collection</h2>
            <p className="text-muted-foreground mt-1">
              {readinessStatus === 'connecting' ? 'Connecting to backend...' : 'Initializing...'}
            </p>
          </div>
        </div>
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            {readinessStatus === 'connecting' 
              ? 'Establishing connection to backend. This should take no more than 45 seconds...'
              : 'Initializing backend connection...'}
          </AlertDescription>
        </Alert>
        <div className="flex flex-col items-center gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="w-[900px] h-[78px]" />
          ))}
        </div>
      </div>
    );
  }

  // Show actor connection error prominently with category-specific messaging
  if (actorError) {
    const isAuthError = errorCategory === 'authorization';
    const isTimeout = errorCategory === 'timeout';
    const isTransient = errorCategory === 'transient' || errorCategory === 'connecting' || isTimeout;

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">My Manga Collection</h2>
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
            <span>{actorErrorMessage || 'Failed to connect to backend'}</span>
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
              : isTimeout
              ? 'The connection attempt took too long. Please check your network and try again.'
              : 'Unable to connect to the backend. Please check your connection and try again.'}
          </p>
          {isTransient && (
            <Button onClick={retryActor} variant="default" disabled={isRetrying}>
              {isRetrying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Retrying Connection...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Connection
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Error loading manga list. Please try again.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex flex-col items-center gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="w-[900px] h-[78px]" />
          ))}
        </div>
      </div>
    );
  }

  const hasFilters = titleSearch || synopsisSearch || notesSearch || selectedGenres.length > 0 || bookmarkedOnly;

  // Prevent page changes while not ready
  const handlePageChange = (newPage: number) => {
    if (!isActorReady) {
      return;
    }
    setCurrentPage(newPage);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Manga Collection</h2>
          <p className="text-muted-foreground mt-1">
            {filteredAndSortedEntries.length === 0 
              ? hasFilters 
                ? 'No manga match your filters' 
                : 'Start building your collection'
              : `${filteredAndSortedEntries.length} manga ${hasFilters ? 'found' : 'total'}`}
          </p>
        </div>
        <Button 
          onClick={() => setIsAddDialogOpen(true)} 
          className="gap-2"
          disabled={!isActorReady}
        >
          <Plus className="h-4 w-4" />
          Add Manga
        </Button>
      </div>

      {(allEntries && allEntries.length > 0) && (
        <MangaListControls
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
          sortBy={sortBy}
          onSortByChange={setSortBy}
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
              onClick={() => setIsAddDialogOpen(true)} 
              className="gap-2"
              disabled={!isActorReady}
            >
              <Plus className="h-4 w-4" />
              Add Your First Manga
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center gap-4 overflow-x-auto pb-4">
            {paginatedEntries.map((manga, index) => (
              <MangaCard key={index} manga={manga} />
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

      <AddMangaDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen}
        currentPage={currentPage}
      />
    </div>
  );
}
