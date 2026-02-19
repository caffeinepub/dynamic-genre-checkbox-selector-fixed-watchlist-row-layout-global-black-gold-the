import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MangaEntry } from '../../backend';
import { Star, Bookmark, FileText, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useUpdateMangaRating, useToggleBookmark, useUpdateNotes, useUpdateCompletionStatus, useUpdateChapterProgress } from '../../hooks/useMangaMutations';
import { useBackendConnectionSingleton } from '../../hooks/useBackendConnectionSingleton';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { Loader2 } from 'lucide-react';
import { EditNotesDialog } from './EditNotesDialog';
import { NotesPreviewOverlay } from './NotesPreviewOverlay';
import { AutoScrollTitle } from './AutoScrollTitle';
import { CoverHoverPopup } from './CoverHoverPopup';
import { useCachedCoverImageUrl } from '../../hooks/useCachedCoverImageUrl';
import { formatChapterNumber } from '../../utils/formatChapterNumber';

interface MangaCardProps {
  manga: MangaEntry;
}

const MangaCardComponent = ({ manga }: MangaCardProps) => {
  const [titleIndex, setTitleIndex] = useState(0);
  const [ratingPopoverOpen, setRatingPopoverOpen] = useState(false);
  const [newRating, setNewRating] = useState(manga.rating.toString());
  const [chapterPopoverOpen, setChapterPopoverOpen] = useState(false);
  const [newChaptersRead, setNewChaptersRead] = useState(manga.chaptersRead.toString());
  const [newAvailableChapters, setNewAvailableChapters] = useState(manga.availableChapters.toString());
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [notesHovered, setNotesHovered] = useState(false);
  const [coverPopupOpen, setCoverPopupOpen] = useState(false);
  
  const coverRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { isReady } = useBackendConnectionSingleton();
  const { identity } = useInternetIdentity();
  const updateRatingMutation = useUpdateMangaRating();
  const toggleBookmarkMutation = useToggleBookmark();
  const updateNotesMutation = useUpdateNotes();
  const updateCompletionMutation = useUpdateCompletionStatus();
  const updateChapterProgressMutation = useUpdateChapterProgress();
  
  const networkCoverUrl = manga.coverImages.length > 0 
    ? manga.coverImages[0].getDirectURL() 
    : '/assets/generated/cover-placeholder.dim_600x900.png';

  const principal = identity?.getPrincipal().toString();
  const coverUrl = useCachedCoverImageUrl(principal, manga.stableId, networkCoverUrl);

  const allTitles = [manga.title, ...manga.alternateTitles];
  const hasAlternateTitles = manga.alternateTitles.length > 0;
  const currentTitle = allTitles[titleIndex];

  const hasNotes = manga.notes.trim().length > 0;
  const isHighRating = manga.rating >= 8.5;

  const cycleTitle = useCallback(() => {
    if (allTitles.length > 1) {
      setTitleIndex((prev) => (prev + 1) % allTitles.length);
    }
  }, [allTitles.length]);

  const handleRatingSubmit = useCallback(async () => {
    if (!isReady) return;
    
    const rating = parseFloat(newRating);
    if (isNaN(rating) || rating < 0 || rating > 10) return;

    try {
      await updateRatingMutation.mutateAsync({ stableId: manga.stableId, rating });
      setRatingPopoverOpen(false);
    } catch (error) {
      console.error('Failed to update rating:', error);
    }
  }, [isReady, newRating, updateRatingMutation, manga.stableId]);

  const handleChapterProgressSubmit = useCallback(async () => {
    if (!isReady) return;
    
    const chaptersRead = parseFloat(newChaptersRead);
    const availableChapters = parseFloat(newAvailableChapters);
    
    if (isNaN(chaptersRead) || isNaN(availableChapters) || chaptersRead < 0 || availableChapters < 0) return;

    try {
      await updateChapterProgressMutation.mutateAsync({ 
        stableId: manga.stableId, 
        chaptersRead, 
        availableChapters 
      });
      setChapterPopoverOpen(false);
    } catch (error) {
      console.error('Failed to update chapter progress:', error);
    }
  }, [isReady, newChaptersRead, newAvailableChapters, updateChapterProgressMutation, manga.stableId]);

  const handleBookmarkToggle = useCallback(async () => {
    if (!isReady) return;
    
    try {
      await toggleBookmarkMutation.mutateAsync(manga.stableId);
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  }, [isReady, toggleBookmarkMutation, manga.stableId]);

  const handleNotesSave = useCallback(async (notes: string) => {
    if (!isReady) return;
    
    try {
      await updateNotesMutation.mutateAsync({ stableId: manga.stableId, notes });
    } catch (error) {
      console.error('Failed to update notes:', error);
    }
  }, [isReady, updateNotesMutation, manga.stableId]);

  const handleCompletionChange = useCallback(async (value: string) => {
    if (!isReady) return;
    
    const completed = value === 'complete';
    try {
      await updateCompletionMutation.mutateAsync({ stableId: manga.stableId, completed });
    } catch (error) {
      console.error('Failed to update completion status:', error);
    }
  }, [isReady, updateCompletionMutation, manga.stableId]);

  const startCloseTimer = useCallback(() => {
    closeTimerRef.current = setTimeout(() => {
      setCoverPopupOpen(false);
    }, 500);
  }, []);

  const cancelCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const handleCoverMouseEnter = useCallback(() => {
    cancelCloseTimer();
    setCoverPopupOpen(true);
  }, [cancelCloseTimer]);

  const handleCoverMouseLeave = useCallback(() => {
    startCloseTimer();
  }, [startCloseTimer]);

  const handlePopupMouseEnter = useCallback(() => {
    cancelCloseTimer();
  }, [cancelCloseTimer]);

  const handlePopupMouseLeave = useCallback(() => {
    startCloseTimer();
  }, [startCloseTimer]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  // Calculate optimal genre grid layout (max 3 rows × 4 columns = 12 genres)
  const maxGenres = 12;
  const displayGenres = manga.genres.slice(0, maxGenres);
  const genreCount = displayGenres.length;
  
  // Calculate grid dimensions for most rectangular shape
  let gridCols = 4;
  let gridRows = 3;
  
  if (genreCount <= 4) {
    gridCols = genreCount;
    gridRows = 1;
  } else if (genreCount <= 8) {
    gridCols = 4;
    gridRows = 2;
  } else {
    gridCols = 4;
    gridRows = 3;
  }

  return (
    <>
      <div className="manga-card-container w-full h-[78px] shrink-0 bg-black border-2 border-gold rounded-lg flex items-center gap-3 px-3 overflow-hidden shadow-gold-glow relative transition-all duration-300">
        {/* Cover Image */}
        <div 
          ref={coverRef}
          className="h-[62px] w-[42px] shrink-0 cursor-pointer relative rounded overflow-hidden"
          onMouseEnter={handleCoverMouseEnter}
          onMouseLeave={handleCoverMouseLeave}
        >
          <img
            src={coverUrl}
            alt={manga.title}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Main Content Area - Single Cohesive Row */}
        <div className="flex-1 min-w-0 flex items-center gap-4">
          {/* Title + Status + Rating + Progress */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Title with click cycling */}
            <div className="w-[200px] shrink-0 overflow-hidden h-[50px]">
              <AutoScrollTitle title={currentTitle} onClick={cycleTitle} />
            </div>

            {/* Completion Status with chapters below */}
            <div className="shrink-0 flex flex-col items-center gap-1">
              <Select
                value={manga.completed ? 'complete' : 'incomplete'}
                onValueChange={handleCompletionChange}
                disabled={!isReady || updateCompletionMutation.isPending}
              >
                <SelectTrigger className="h-7 w-[100px] text-xs border-transparent bg-transparent [&>svg]:hidden">
                  <SelectValue>
                    {manga.completed ? (
                      <span className="rainbow-text font-semibold">Complete</span>
                    ) : (
                      <span>Incomplete</span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incomplete">Incomplete</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Chapters read/available centered below status */}
              <div className="text-gold/70 text-xs">
                {formatChapterNumber(manga.chaptersRead)}/{formatChapterNumber(manga.availableChapters)}
              </div>
            </div>

            {/* Rating */}
            <Popover open={ratingPopoverOpen} onOpenChange={setRatingPopoverOpen}>
              <PopoverTrigger asChild>
                <div className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity shrink-0">
                  <Star className={`h-4 w-4 ${isHighRating ? 'fill-gold text-gold' : 'text-gold'}`} />
                  <span className="text-gold text-sm font-medium">{manga.rating.toFixed(1)}</span>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-56">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Update Rating</h4>
                  <div className="space-y-2">
                    <Label htmlFor="rating" className="text-xs">Rating (0-10)</Label>
                    <Input
                      id="rating"
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={newRating}
                      onChange={(e) => setNewRating(e.target.value)}
                      disabled={!isReady || updateRatingMutation.isPending}
                    />
                  </div>
                  <Button
                    onClick={handleRatingSubmit}
                    className="w-full"
                    size="sm"
                    disabled={!isReady || updateRatingMutation.isPending}
                  >
                    {updateRatingMutation.isPending ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update'
                    )}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Genres Grid - Dynamic layout up to 3 rows × 4 columns */}
          <div 
            className="flex-1 min-w-0 grid gap-1 pr-12"
            style={{
              gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${gridRows}, auto)`,
            }}
          >
            {displayGenres.map((genre, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-amber-800 text-white text-xs rounded border border-amber-700 whitespace-nowrap overflow-hidden text-ellipsis text-center"
              >
                {genre}
              </span>
            ))}
          </div>
        </div>

        {/* Bookmark Icon - Top Right */}
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 absolute top-1 right-1 ${manga.isBookmarked ? 'text-gold rainbow-glow' : 'text-gold/50 hover:text-gold'}`}
          onClick={handleBookmarkToggle}
          disabled={!isReady || toggleBookmarkMutation.isPending}
        >
          {toggleBookmarkMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Bookmark className={`h-4 w-4 ${manga.isBookmarked ? 'fill-current' : ''}`} />
          )}
        </Button>

        {/* Notes Icon - Bottom Right with red exclamation mark when notes exist */}
        <div className="absolute bottom-1 right-1">
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${hasNotes ? 'text-gold' : 'text-gold/30 hover:text-gold'}`}
            onClick={() => setNotesDialogOpen(true)}
            onMouseEnter={() => setNotesHovered(true)}
            onMouseLeave={() => setNotesHovered(false)}
            disabled={!isReady}
          >
            <FileText className="h-4 w-4" />
          </Button>
          {hasNotes && (
            <div className="absolute -top-1 -right-1 pointer-events-none">
              <AlertCircle className="h-3 w-3 text-red-600 fill-red-600" />
            </div>
          )}
          <NotesPreviewOverlay notes={manga.notes} visible={notesHovered} />
        </div>
      </div>

      {/* Cover Popup */}
      {coverPopupOpen && (
        <CoverHoverPopup
          manga={manga}
          onMouseEnter={handlePopupMouseEnter}
          onMouseLeave={handlePopupMouseLeave}
          onClose={() => setCoverPopupOpen(false)}
        />
      )}

      {/* Notes Dialog */}
      <EditNotesDialog
        open={notesDialogOpen}
        onOpenChange={setNotesDialogOpen}
        currentNotes={manga.notes}
        onSave={handleNotesSave}
        isSaving={updateNotesMutation.isPending}
      />
    </>
  );
};

export const MangaCard = React.memo(MangaCardComponent);
