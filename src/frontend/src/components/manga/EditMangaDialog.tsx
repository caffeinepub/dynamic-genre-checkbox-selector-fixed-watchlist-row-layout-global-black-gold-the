import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useUpdateMangaEntry } from '../../hooks/useMangaMutations';
import { useBackendConnectionSingleton } from '../../hooks/useBackendConnectionSingleton';
import { MangaEntry, ExternalBlob, UpdateFields } from '../../backend';
import { CoverImagesField } from './CoverImagesField';
import { GenreCheckboxGrid } from './GenreCheckboxGrid';
import { useLibraryGenres } from '../../hooks/useLibraryGenres';
import { Loader2, AlertCircle, Plus } from 'lucide-react';
import { BACKEND_NOT_READY_MESSAGE } from '../../utils/backendNotReadyMessage';

interface EditMangaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manga: MangaEntry;
  currentPage: number;
}

export function EditMangaDialog({ open, onOpenChange, manga, currentPage }: EditMangaDialogProps) {
  const [title, setTitle] = useState(manga.title);
  const [alternateTitles, setAlternateTitles] = useState(manga.alternateTitles.join(', '));
  const [selectedGenres, setSelectedGenres] = useState<string[]>(manga.genres);
  const [coverImages, setCoverImages] = useState<ExternalBlob[]>(manga.coverImages);
  const [synopsis, setSynopsis] = useState(manga.synopsis);
  const [chaptersRead, setChaptersRead] = useState(manga.chaptersRead.toString());
  const [availableChapters, setAvailableChapters] = useState(manga.availableChapters.toString());
  const [newGenreInput, setNewGenreInput] = useState('');
  const [customGenres, setCustomGenres] = useState<string[]>([]);

  const { isReady } = useBackendConnectionSingleton();
  const updateMutation = useUpdateMangaEntry(currentPage);
  const { genres: libraryGenres } = useLibraryGenres();

  // Union of library genres and custom genres (selected genres are a subset)
  const allAvailableGenres = Array.from(
    new Set([...libraryGenres, ...customGenres])
  ).sort((a, b) => a.localeCompare(b));

  // Reset form when manga changes or dialog opens
  useEffect(() => {
    if (open) {
      setTitle(manga.title);
      setAlternateTitles(manga.alternateTitles.join(', '));
      setSelectedGenres(manga.genres);
      setCoverImages(manga.coverImages);
      setSynopsis(manga.synopsis);
      setChaptersRead(manga.chaptersRead.toString());
      setAvailableChapters(manga.availableChapters.toString());
      setNewGenreInput('');
      setCustomGenres([]);
    }
  }, [open, manga]);

  // Auto-prune selectedGenres when library genres change
  useEffect(() => {
    setSelectedGenres(prev => {
      const validGenres = prev.filter(g => 
        libraryGenres.includes(g) || customGenres.includes(g)
      );
      if (validGenres.length !== prev.length) {
        return validGenres;
      }
      return prev;
    });
  }, [libraryGenres, customGenres]);

  const handleAddGenre = () => {
    const trimmed = newGenreInput.trim();
    if (trimmed && !allAvailableGenres.includes(trimmed)) {
      setCustomGenres([...customGenres, trimmed]);
      setSelectedGenres([...selectedGenres, trimmed]);
      setNewGenreInput('');
    } else if (trimmed && allAvailableGenres.includes(trimmed)) {
      // If genre already exists, just select it
      if (!selectedGenres.includes(trimmed)) {
        setSelectedGenres([...selectedGenres, trimmed]);
      }
      setNewGenreInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isReady) {
      console.error(BACKEND_NOT_READY_MESSAGE);
      return;
    }

    const alternateTitlesArray = alternateTitles
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    // Compute delta: only include fields that changed
    const updates: UpdateFields = {
      stableId: manga.stableId,
    };

    if (title !== manga.title) {
      updates.title = title;
    }

    const altTitlesChanged = 
      alternateTitlesArray.length !== manga.alternateTitles.length ||
      alternateTitlesArray.some((t, i) => t !== manga.alternateTitles[i]);
    if (altTitlesChanged) {
      updates.alternateTitles = alternateTitlesArray;
    }

    const genresChanged = 
      selectedGenres.length !== manga.genres.length ||
      selectedGenres.some((g, i) => g !== manga.genres[i]);
    if (genresChanged) {
      updates.genres = selectedGenres;
    }

    // Only send coverImages if they changed
    const coversChanged = 
      coverImages.length !== manga.coverImages.length ||
      coverImages.some((c, i) => c.getDirectURL() !== manga.coverImages[i].getDirectURL());
    if (coversChanged) {
      updates.coverImages = coverImages;
    }

    if (synopsis !== manga.synopsis) {
      updates.synopsis = synopsis;
    }

    const newChaptersRead = parseFloat(chaptersRead);
    if (!isNaN(newChaptersRead) && newChaptersRead !== manga.chaptersRead) {
      updates.chaptersRead = newChaptersRead;
    }

    const newAvailableChapters = parseFloat(availableChapters);
    if (!isNaN(newAvailableChapters) && newAvailableChapters !== manga.availableChapters) {
      updates.availableChapters = newAvailableChapters;
    }

    try {
      await updateMutation.mutateAsync({ stableId: manga.stableId, updates });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update manga:', error);
    }
  };

  const handleClose = () => {
    if (!updateMutation.isPending) {
      onOpenChange(false);
    }
  };

  const canSubmit = title.trim() && isReady && !updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] md:max-h-[90dvh] flex flex-col overflow-hidden p-0 bg-card border-gold">
        {/* Fixed Header */}
        <DialogHeader className="px-6 py-4 border-b border-gold shrink-0 flex flex-row items-center justify-between">
          <DialogTitle className="text-gold">Edit Manga</DialogTitle>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={updateMutation.isPending}
              className="text-gold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-3 w-3 mr-2 animate-spin text-gold" />
                  <span className="text-gold">Saving...</span>
                </>
              ) : (
                <span className="text-gold">Save Changes</span>
              )}
            </Button>
          </div>
        </DialogHeader>

        {/* Backend not ready warning */}
        {!isReady && (
          <div className="px-6 py-2 bg-muted border-b border-gold">
            <div className="flex items-center gap-2 text-sm text-gold">
              <AlertCircle className="h-4 w-4" />
              <span>Backend is connecting. Please wait...</span>
            </div>
          </div>
        )}

        {/* Scrollable Body */}
        <div 
          className="flex-1 min-h-0 px-6"
          style={{ 
            maxHeight: '400px',
            overflowY: 'scroll',
            overscrollBehavior: 'contain'
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title" className="text-gold">Title *</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter manga title"
                required
                disabled={updateMutation.isPending || !isReady}
                className="border-gold text-gold placeholder:text-gold/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-alternate-titles" className="text-gold">Alternate Titles (comma-separated)</Label>
              <Input
                id="edit-alternate-titles"
                value={alternateTitles}
                onChange={(e) => setAlternateTitles(e.target.value)}
                placeholder="Title 1, Title 2, ..."
                disabled={updateMutation.isPending || !isReady}
                className="border-gold text-gold placeholder:text-gold/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gold">Genres</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newGenreInput}
                  onChange={(e) => setNewGenreInput(e.target.value)}
                  placeholder="Add new genre"
                  disabled={updateMutation.isPending || !isReady}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddGenre();
                    }
                  }}
                  className="border-gold text-gold placeholder:text-gold/50"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddGenre}
                  disabled={!newGenreInput.trim() || updateMutation.isPending || !isReady}
                >
                  <Plus className="h-4 w-4 text-gold" />
                </Button>
              </div>
              <GenreCheckboxGrid
                genres={allAvailableGenres}
                selectedGenres={selectedGenres}
                onGenreToggle={(genre) => {
                  if (selectedGenres.includes(genre)) {
                    setSelectedGenres(selectedGenres.filter(g => g !== genre));
                  } else {
                    setSelectedGenres([...selectedGenres, genre]);
                  }
                }}
                disabled={updateMutation.isPending || !isReady}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gold">Cover Images</Label>
              <CoverImagesField
                coverImages={coverImages}
                onChange={setCoverImages}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-synopsis" className="text-gold">Synopsis</Label>
              <Textarea
                id="edit-synopsis"
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                placeholder="Enter synopsis"
                rows={4}
                disabled={updateMutation.isPending || !isReady}
                className="border-gold text-gold placeholder:text-gold/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-chapters-read" className="text-gold">Chapters Read</Label>
                <Input
                  id="edit-chapters-read"
                  type="number"
                  min="0"
                  step="0.1"
                  value={chaptersRead}
                  onChange={(e) => setChaptersRead(e.target.value)}
                  disabled={updateMutation.isPending || !isReady}
                  className="border-gold text-gold"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-available-chapters" className="text-gold">Available Chapters</Label>
                <Input
                  id="edit-available-chapters"
                  type="number"
                  min="0"
                  step="0.1"
                  value={availableChapters}
                  onChange={(e) => setAvailableChapters(e.target.value)}
                  disabled={updateMutation.isPending || !isReady}
                  className="border-gold text-gold"
                />
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
