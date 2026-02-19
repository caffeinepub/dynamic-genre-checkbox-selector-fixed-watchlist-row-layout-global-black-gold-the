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
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [notesHovered, setNotesHovered] = useState(false);
  const [coverPopupOpen, setCoverPopupOpen] = useState(false);
  const [isEditingChapters, setIsEditingChapters] = useState(false);
  const [editChaptersRead, setEditChaptersRead] = useState(manga.chaptersRead.toString());
  
  const coverRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const chapterInputRef = useRef<HTMLInputElement>(null);
  
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
  const isHighRating = manga.rating >= 8.0;

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

  const handleChapterEditClick = useCallback(() => {
    setIsEditingChapters(true);
    setEditChaptersRead(manga.chaptersRead.toString());
  }, [manga.chaptersRead]);

  const handleChapterEditSave = useCallback(async () => {
    if (!isReady) return;
    
    const chaptersRead = parseFloat(editChaptersRead);
    
    if (isNaN(chaptersRead) || chaptersRead < 0) {
      setIsEditingChapters(false);
      setEditChaptersRead(manga.chaptersRead.toString());
      return;
    }

    try {
      await updateChapterProgressMutation.mutateAsync({ 
        stableId: manga.stableId, 
        chaptersRead, 
        availableChapters: manga.availableChapters 
      });
      setIsEditingChapters(false);
    } catch (error) {
      console.error('Failed to update chapter progress:', error);
      setIsEditingChapters(false);
      setEditChaptersRead(manga.chaptersRead.toString());
    }
  }, [isReady, editChaptersRead, updateChapterProgressMutation, manga.stableId, manga.availableChapters, manga.chaptersRead]);

  const handleChapterEditCancel = useCallback(() => {
    setIsEditingChapters(false);
    setEditChaptersRead(manga.chaptersRead.toString());
  }, [manga.chaptersRead]);

  const handleChapterEditKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleChapterEditSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleChapterEditCancel();
    }
  }, [handleChapterEditSave, handleChapterEditCancel]);

  useEffect(() => {
    if (isEditingChapters && chapterInputRef.current) {
      chapterInputRef.current.focus();
      chapterInputRef.current.select();
    }
  }, [isEditingChapters]);

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

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      <div className="bg-card border-2 border-gold rounded-lg overflow-hidden shadow-lg hover:shadow-gold-glow transition-all duration-300 hover:rainbow-border-shift group">
        {/* Cover Image */}
        <div 
          ref={coverRef}
          className="relative w-full aspect-[2/3] bg-muted cursor-pointer"
          onClick={() => setCoverPopupOpen(true)}
          onMouseEnter={cancelCloseTimer}
          onMouseLeave={startCloseTimer}
        >
          <img
            src={coverUrl}
            alt={manga.title}
            className="w-full h-full object-cover"
          />
          
          {/* Bookmark Icon - Top Right */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleBookmarkToggle();
            }}
            disabled={!isReady || toggleBookmarkMutation.isPending}
            className="absolute top-2 right-2 p-1.5 bg-black/70 rounded-full hover:bg-black/90 transition-colors disabled:opacity-50"
          >
            {toggleBookmarkMutation.isPending ? (
              <Loader2 className="h-5 w-5 text-gold animate-spin" />
            ) : (
              <Bookmark
                className={`h-5 w-5 text-gold ${manga.isBookmarked ? 'fill-gold' : ''}`}
              />
            )}
          </button>

          {/* Notes Icon - Bottom Right */}
          <div
            className="absolute bottom-2 right-2"
            onMouseEnter={() => setNotesHovered(true)}
            onMouseLeave={() => setNotesHovered(false)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setNotesDialogOpen(true);
              }}
              className="p-1.5 bg-black/70 rounded-full hover:bg-black/90 transition-colors relative"
            >
              <FileText className="h-5 w-5 text-gold" />
              {hasNotes && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-2 w-2 text-white" />
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          {/* Title with scroll animation */}
          <AutoScrollTitle
            title={currentTitle}
            onClick={hasAlternateTitles ? cycleTitle : undefined}
            className="text-gold"
          />

          {/* Genres Grid - max 3 rows × 4 columns */}
          {manga.genres.length > 0 && (
            <div className="grid grid-cols-4 gap-1 max-h-[4.5rem] overflow-hidden bg-amber-900/30 p-1.5 rounded">
              {manga.genres.slice(0, 12).map((genre, idx) => (
                <span
                  key={idx}
                  className="text-[10px] text-gold text-center truncate px-1 py-0.5 bg-black/40 rounded"
                  title={genre}
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          {/* Status Selector */}
          <div className="flex items-center gap-2">
            <Label className="text-xs text-gold shrink-0">Status:</Label>
            <Select
              value={manga.completed ? 'complete' : 'incomplete'}
              onValueChange={handleCompletionChange}
              disabled={!isReady || updateCompletionMutation.isPending}
            >
              <SelectTrigger className="h-7 text-xs border-gold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="incomplete" className="text-red-500">Incomplete</SelectItem>
                <SelectItem value="complete" className="rainbow-text">Complete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Chapters Progress - Clickable to Edit */}
          <div className="flex items-center justify-center gap-2">
            {isEditingChapters ? (
              <div className="flex items-center gap-1">
                <Input
                  ref={chapterInputRef}
                  type="number"
                  min="0"
                  step="0.1"
                  value={editChaptersRead}
                  onChange={(e) => setEditChaptersRead(e.target.value)}
                  onKeyDown={handleChapterEditKeyDown}
                  onBlur={handleChapterEditSave}
                  className="h-7 w-16 text-xs text-center border-gold text-gold"
                  disabled={!isReady || updateChapterProgressMutation.isPending}
                />
                <span className="text-xs text-gold">/</span>
                <span className="text-xs text-gold">{formatChapterNumber(manga.availableChapters)}</span>
              </div>
            ) : (
              <button
                onClick={handleChapterEditClick}
                className="text-xs text-gold hover:underline cursor-pointer"
                disabled={!isReady}
              >
                {formatChapterNumber(manga.chaptersRead)} / {formatChapterNumber(manga.availableChapters)} chapters
              </button>
            )}
          </div>

          {/* Rating */}
          <Popover open={ratingPopoverOpen} onOpenChange={setRatingPopoverOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center justify-center gap-1 w-full hover:bg-muted/50 rounded p-1 transition-colors">
                <Star className="h-4 w-4 text-gold fill-gold" />
                <span className={`text-sm font-semibold ${isHighRating ? 'rainbow-text' : 'text-gold'}`}>
                  {manga.rating.toFixed(1)}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 bg-card border-gold">
              <div className="space-y-2">
                <Label htmlFor="rating-input" className="text-gold">Rating (0-10)</Label>
                <Input
                  id="rating-input"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={newRating}
                  onChange={(e) => setNewRating(e.target.value)}
                  disabled={!isReady || updateRatingMutation.isPending}
                  className="border-gold text-gold"
                />
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
                    'Update Rating'
                  )}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Notes Dialog */}
      <EditNotesDialog
        open={notesDialogOpen}
        onOpenChange={setNotesDialogOpen}
        currentNotes={manga.notes}
        onSave={handleNotesSave}
        isSaving={updateNotesMutation.isPending}
      />

      {/* Notes Preview Overlay */}
      <NotesPreviewOverlay notes={manga.notes} visible={notesHovered && hasNotes} />

      {/* Cover Popup */}
      {coverPopupOpen && (
        <CoverHoverPopup
          manga={manga}
          onClose={() => setCoverPopupOpen(false)}
          onMouseEnter={cancelCloseTimer}
          onMouseLeave={startCloseTimer}
        />
      )}
    </>
  );
};

export const MangaCard = React.memo(MangaCardComponent);
