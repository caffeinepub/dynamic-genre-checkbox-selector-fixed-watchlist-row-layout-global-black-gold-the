import { useState } from 'react';
import { useGetMangaPage } from '../../hooks/useMangaPage';
import { useActorWithRetry } from '../../hooks/useActorWithRetry';
import { AddMangaDialog } from './AddMangaDialog';
import { PaginationControls } from './PaginationControls';
import { MangaCard } from './MangaCard';
import { Button } from '../ui/button';
import { Plus, BookOpen, AlertCircle, Loader2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription } from '../ui/alert';

export function MangaListPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
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
  
  const { data: mangaPage, isLoading, error } = useGetMangaPage(currentPage);

  // Show connecting/initializing state
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
              ? 'Establishing connection to backend. Please wait...'
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
    const isTransient = errorCategory === 'transient' || errorCategory === 'connecting';

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">My Manga Collection</h2>
            <p className="text-muted-foreground mt-1">
              {isAuthError ? 'Authorization required' : 'Connection issue detected'}
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
                {isRetrying ? 'Retrying...' : 'Retry Connection'}
              </Button>
            )}
          </AlertDescription>
        </Alert>
        <div className="text-center py-16 border-2 border-dashed border-border rounded-lg">
          <AlertCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {isAuthError ? 'Authorization Required' : 'Connection Error'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {isAuthError 
              ? 'You need to be logged in to access your manga collection.'
              : 'Unable to connect to the backend. Please check your connection and try again.'}
          </p>
          {isTransient && (
            <Button onClick={retryActor} variant="default" disabled={isRetrying}>
              {isRetrying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                'Retry Connection'
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

  const entries = mangaPage?.entries || [];
  const totalPages = Number(mangaPage?.totalPages || 1);

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
            {entries.length === 0 ? 'Start building your collection' : `${entries.length} manga on this page`}
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

      {entries.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-lg">
          <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No manga yet</h3>
          <p className="text-muted-foreground mb-6">Start by adding your first manga to your watchlist</p>
          <Button 
            onClick={() => setIsAddDialogOpen(true)} 
            className="gap-2"
            disabled={!isActorReady}
          >
            <Plus className="h-4 w-4" />
            Add Your First Manga
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center gap-4 overflow-x-auto pb-4">
            {entries.slice(0, 30).map((manga, index) => (
              <MangaCard key={index} manga={manga} />
            ))}
          </div>

          {totalPages > 1 && (
            <PaginationControls
              currentPage={currentPage}
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
