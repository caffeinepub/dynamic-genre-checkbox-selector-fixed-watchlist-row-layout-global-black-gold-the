import React, { useState, useCallback } from 'react';
import { MangaEntry } from '../../backend';
import { MangaCard } from './MangaCard';
import { EditMangaDialog } from './EditMangaDialog';
import { Button } from '../ui/button';
import { Pencil, Trash2, Loader2 } from 'lucide-react';
import { useDeleteMangaEntry } from '../../hooks/useMangaMutations';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

interface MangaRowActionsProps {
  manga: MangaEntry;
  currentPage: number;
  isBackendReady: boolean;
}

const MangaRowActionsComponent = ({ manga, currentPage, isBackendReady }: MangaRowActionsProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const deleteMutation = useDeleteMangaEntry(currentPage);

  const handleDelete = useCallback(async () => {
    if (!isBackendReady) return;
    
    try {
      await deleteMutation.mutateAsync(manga.stableId);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete manga:', error);
    }
  }, [isBackendReady, deleteMutation, manga.stableId]);

  const handleEditClick = useCallback(() => {
    if (!isBackendReady) return;
    setIsEditDialogOpen(true);
  }, [isBackendReady]);

  const handleDeleteClick = useCallback(() => {
    if (!isBackendReady) return;
    setIsDeleteDialogOpen(true);
  }, [isBackendReady]);

  return (
    <>
      <div className="flex items-center gap-3 w-full">
        <div className="flex-1 min-w-0">
          <MangaCard manga={manga} />
        </div>
        
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleEditClick}
            disabled={!isBackendReady}
            title="Edit manga"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={handleDeleteClick}
            disabled={!isBackendReady || deleteMutation.isPending}
            title="Delete manga"
          >
            {deleteMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Only mount EditMangaDialog when open */}
      {isEditDialogOpen && (
        <EditMangaDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          manga={manga}
          currentPage={currentPage}
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Manga</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{manga.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// Memoize to avoid re-rendering unaffected rows
export const MangaRowActions = React.memo(MangaRowActionsComponent, (prevProps, nextProps) => {
  return (
    prevProps.manga.stableId === nextProps.manga.stableId &&
    prevProps.currentPage === nextProps.currentPage &&
    prevProps.isBackendReady === nextProps.isBackendReady &&
    // Deep comparison of manga object for changes
    prevProps.manga.title === nextProps.manga.title &&
    prevProps.manga.rating === nextProps.manga.rating &&
    prevProps.manga.completed === nextProps.manga.completed &&
    prevProps.manga.isBookmarked === nextProps.manga.isBookmarked &&
    prevProps.manga.notes === nextProps.manga.notes &&
    prevProps.manga.genres.length === nextProps.manga.genres.length &&
    prevProps.manga.alternateTitles.length === nextProps.manga.alternateTitles.length
  );
});

MangaRowActions.displayName = 'MangaRowActions';
