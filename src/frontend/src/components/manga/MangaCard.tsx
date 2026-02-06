import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MangaEntry } from '../../backend';
import { Star, Bookmark, FileText, AlertCircle, ArrowRight } from 'lucide-react';
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
    setTitleIndex((prev) => (prev + 1) % allTitles.length);
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

  // Prepare genres display: up to 9 chips + overflow count
  const displayGenres = manga.genres.slice(0, 9);
  const remainingGenresCount = Math.max(0, manga.genres.length - 9);

  return (
    <>
      <div className="w-full h-[78px] shrink-0 bg-black border-2 border-gold rounded-lg flex items-center overflow-hidden shadow-gold-glow relative">
        {/* Bookmark - Top Right */}
        <div className="absolute top-1 right-1 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0 hover:bg-transparent"
            onClick={handleBookmarkToggle}
            disabled={!isReady || toggleBookmarkMutation.isPending}
          >
            <Bookmark 
              className={`h-4 w-4 ${manga.isBookmarked ? 'fill-gold text-gold rainbow-glow' : 'text-gold'}`}
            />
          </Button>
        </div>

        {/* Notes - Bottom Right */}
        <div className="absolute bottom-1 right-1 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0 hover:bg-transparent relative"
            onClick={() => setNotesDialogOpen(true)}
            onMouseEnter={() => setNotesHovered(true)}
            onMouseLeave={() => setNotesHovered(false)}
            disabled={!isReady}
          >
            <FileText className="h-4 w-4 text-gold" />
            {hasNotes && (
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full flex items-center justify-center">
                <AlertCircle className="h-1.5 w-1.5 text-white" />
              </div>
            )}
          </Button>
        </div>

        {/* Cover Image - Black Background */}
        <div 
          ref={coverRef}
          className="w-auto h-full shrink-0 flex items-center justify-center bg-black overflow-hidden cursor-pointer px-2"
          onMouseEnter={handleCoverMouseEnter}
          onMouseLeave={handleCoverMouseLeave}
        >
          <img 
            src={coverUrl} 
            alt={manga.title}
            className="h-full object-cover"
            loading="lazy"
            style={{ width: 'auto', maxWidth: '70px' }}
          />
        </div>

        {/* Title with Auto-Scroll - Black Background - Fixed 270px width */}
        <div className="h-full shrink-0 px-3 flex items-center bg-black relative" style={{ width: '270px' }}>
          <AutoScrollTitle
            title={currentTitle}
            className="text-gold font-semibold text-sm w-full h-[60px]"
          />
        </div>

        {/* Right-side gutter for arrow and rating - OUTSIDE title area */}
        <div className="h-full shrink-0 px-2 flex flex-col items-start justify-center bg-black relative" style={{ width: '50px' }}>
          {hasAlternateTitles ? (
            <>
              {/* Dark brown arrow for cycling titles - left-aligned, moved down 5px (from -15px to -10px) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  cycleTitle();
                }}
                className="shrink-0 h-5 w-5 flex items-center justify-center hover:bg-transparent z-10 mb-1"
                style={{ transform: 'translateY(-10px)' }}
                aria-label="Cycle title"
              >
                <ArrowRight className="h-4 w-4 text-amber-900" />
              </button>
              
              {/* Rating below the arrow - horizontal layout, moved up 10px */}
              <div className="flex items-center gap-1 z-10" style={{ transform: 'translateY(-10px)' }}>
                <Popover open={ratingPopoverOpen} onOpenChange={setRatingPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 p-0 hover:bg-transparent"
                      disabled={!isReady || updateRatingMutation.isPending}
                    >
                      <Star className="h-4 w-4 fill-gold text-gold" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="start">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="rating-input">Update Rating</Label>
                        <Input
                          id="rating-input"
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
                        disabled={!isReady || updateRatingMutation.isPending}
                        className="w-full"
                        size="sm"
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
                <span className={`font-semibold text-xs whitespace-nowrap ${isHighRating ? 'rainbow-text' : 'text-gold'}`}>
                  {manga.rating.toFixed(1)}
                </span>
              </div>
            </>
          ) : (
            <>
              {/* Empty spacer matching arrow height when no alternate titles - moved down 5px (from -15px to -10px) */}
              <div className="h-5 w-5 mb-1" style={{ transform: 'translateY(-10px)' }} />
              
              {/* Rating in same position - horizontal layout, moved up 10px */}
              <div className="flex items-center gap-1 z-10" style={{ transform: 'translateY(-10px)' }}>
                <Popover open={ratingPopoverOpen} onOpenChange={setRatingPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 p-0 hover:bg-transparent"
                      disabled={!isReady || updateRatingMutation.isPending}
                    >
                      <Star className="h-4 w-4 fill-gold text-gold" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="start">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="rating-input-alt">Update Rating</Label>
                        <Input
                          id="rating-input-alt"
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
                        disabled={!isReady || updateRatingMutation.isPending}
                        className="w-full"
                        size="sm"
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
                <span className={`font-semibold text-xs whitespace-nowrap ${isHighRating ? 'rainbow-text' : 'text-gold'}`}>
                  {manga.rating.toFixed(1)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Completion Status and Chapter Progress - Black Background */}
        <div className="px-3 shrink-0 h-full flex flex-col items-start justify-center bg-black gap-0.5">
          <Select 
            value={manga.completed ? 'complete' : 'incomplete'} 
            onValueChange={handleCompletionChange}
            disabled={!isReady || updateCompletionMutation.isPending}
          >
            <SelectTrigger className="h-6 border-0 bg-transparent hover:bg-gold/10 px-2 gap-1 whitespace-nowrap [&_svg]:hidden">
              <SelectValue>
                {manga.completed ? (
                  <span className="text-xs font-medium rainbow-text">Complete</span>
                ) : (
                  <span className="text-red-500 text-xs font-medium">Incomplete</span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="complete">
                <span className="rainbow-text">Complete</span>
              </SelectItem>
              <SelectItem value="incomplete">
                <span className="text-red-500">Incomplete</span>
              </SelectItem>
            </SelectContent>
          </Select>
          
          {/* Chapter Progress */}
          <Popover open={chapterPopoverOpen} onOpenChange={setChapterPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="h-5 px-2 py-0 hover:bg-gold/10 text-xs text-gold font-medium"
                disabled={!isReady || updateChapterProgressMutation.isPending}
              >
                {formatChapterNumber(manga.chaptersRead)}/{formatChapterNumber(manga.availableChapters)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="start">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="chapters-read-input">Chapters Read</Label>
                  <Input
                    id="chapters-read-input"
                    type="number"
                    min="0"
                    step="0.1"
                    value={newChaptersRead}
                    onChange={(e) => setNewChaptersRead(e.target.value)}
                    disabled={!isReady || updateChapterProgressMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="available-chapters-input">Available Chapters</Label>
                  <Input
                    id="available-chapters-input"
                    type="number"
                    min="0"
                    step="0.1"
                    value={newAvailableChapters}
                    onChange={(e) => setNewAvailableChapters(e.target.value)}
                    disabled={!isReady || updateChapterProgressMutation.isPending}
                  />
                </div>
                <Button
                  onClick={handleChapterProgressSubmit}
                  disabled={!isReady || updateChapterProgressMutation.isPending}
                  className="w-full"
                  size="sm"
                >
                  {updateChapterProgressMutation.isPending ? (
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

        {/* Genres - Black Background, 3 columns x 3 rows, with right padding for icons */}
        {manga.genres.length > 0 && (
          <div className="px-3 pr-16 flex-1 h-full flex items-center bg-black overflow-hidden">
            <div 
              className="grid gap-1 w-full"
              style={{
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gridTemplateRows: 'repeat(3, auto)',
                maxHeight: '100%',
              }}
            >
              {displayGenres.map((genre, i) => (
                <span 
                  key={i} 
                  className="text-xs border border-gold text-gold bg-amber-900 px-1.5 py-0.5 rounded truncate text-center"
                  title={genre}
                >
                  {genre}
                </span>
              ))}
              {remainingGenresCount > 0 && (
                <span 
                  className="text-xs border border-gold text-gold bg-amber-900 px-1.5 py-0.5 rounded text-center"
                  title={`${remainingGenresCount} more genres`}
                >
                  +{remainingGenresCount}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <EditNotesDialog
        open={notesDialogOpen}
        onOpenChange={setNotesDialogOpen}
        currentNotes={manga.notes}
        onSave={handleNotesSave}
        isSaving={updateNotesMutation.isPending}
      />

      <NotesPreviewOverlay notes={manga.notes} visible={notesHovered && hasNotes} />

      {coverPopupOpen && (
        <CoverHoverPopup
          manga={manga}
          onMouseEnter={handlePopupMouseEnter}
          onMouseLeave={handlePopupMouseLeave}
          onClose={() => setCoverPopupOpen(false)}
        />
      )}
    </>
  );
};

// Memoize with comparison based on stableId and relevant displayed fields
export const MangaCard = React.memo(MangaCardComponent, (prevProps, nextProps) => {
  const prev = prevProps.manga;
  const next = nextProps.manga;
  
  return (
    prev.stableId === next.stableId &&
    prev.title === next.title &&
    prev.rating === next.rating &&
    prev.completed === next.completed &&
    prev.isBookmarked === next.isBookmarked &&
    prev.notes === next.notes &&
    prev.chaptersRead === next.chaptersRead &&
    prev.availableChapters === next.availableChapters &&
    prev.genres.length === next.genres.length &&
    prev.genres.every((g, i) => g === next.genres[i]) &&
    prev.alternateTitles.length === next.alternateTitles.length &&
    prev.alternateTitles.every((t, i) => t === next.alternateTitles[i]) &&
    prev.coverImages.length === next.coverImages.length &&
    (prev.coverImages.length === 0 || prev.coverImages[0].getDirectURL() === next.coverImages[0].getDirectURL())
  );
});

MangaCard.displayName = 'MangaCard';
