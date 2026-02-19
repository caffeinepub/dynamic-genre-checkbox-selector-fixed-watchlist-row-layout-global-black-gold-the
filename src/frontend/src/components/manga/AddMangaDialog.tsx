import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useAddMangaEntry } from '../../hooks/useMangaMutations';
import { useBackendConnectionSingleton } from '../../hooks/useBackendConnectionSingleton';
import { MangaEntry, ExternalBlob } from '../../backend';
import { CoverImagesField } from './CoverImagesField';
import { GenreCheckboxGrid } from './GenreCheckboxGrid';
import { useLibraryGenres } from '../../hooks/useLibraryGenres';
import { Loader2, AlertCircle, Plus } from 'lucide-react';
import { BACKEND_NOT_READY_MESSAGE } from '../../utils/backendNotReadyMessage';

interface AddMangaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPage: number;
}

export function AddMangaDialog({ open, onOpenChange, currentPage }: AddMangaDialogProps) {
  const [title, setTitle] = useState('');
  const [alternateTitle1, setAlternateTitle1] = useState('');
  const [alternateTitle2, setAlternateTitle2] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [coverImages, setCoverImages] = useState<ExternalBlob[]>([]);
  const [synopsis, setSynopsis] = useState('');
  const [chaptersRead, setChaptersRead] = useState('0');
  const [availableChapters, setAvailableChapters] = useState('0');
  const [status, setStatus] = useState<'incomplete' | 'complete'>('incomplete');
  const [rating, setRating] = useState('0');
  const [newGenreInput, setNewGenreInput] = useState('');
  const [customGenres, setCustomGenres] = useState<string[]>([]);

  const { isReady } = useBackendConnectionSingleton();
  const addMutation = useAddMangaEntry(currentPage);
  const { genres: libraryGenres } = useLibraryGenres();

  // Union of library genres and custom genres (selected genres are a subset)
  const allAvailableGenres = Array.from(
    new Set([...libraryGenres, ...customGenres])
  ).sort((a, b) => a.localeCompare(b));

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

  const resetForm = () => {
    setTitle('');
    setAlternateTitle1('');
    setAlternateTitle2('');
    setSelectedGenres([]);
    setCoverImages([]);
    setSynopsis('');
    setChaptersRead('0');
    setAvailableChapters('0');
    setStatus('incomplete');
    setRating('0');
    setNewGenreInput('');
    setCustomGenres([]);
  };

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

    const alternateTitles = [alternateTitle1, alternateTitle2]
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const newEntry: MangaEntry = {
      stableId: BigInt(Date.now()),
      title: title.trim(),
      alternateTitles,
      genres: selectedGenres,
      coverImages,
      synopsis: synopsis.trim(),
      chaptersRead: parseFloat(chaptersRead),
      availableChapters: parseFloat(availableChapters),
      notes: '',
      bookmarks: [],
      rating: parseFloat(rating),
      completed: status === 'complete',
      isBookmarked: false,
    };

    try {
      await addMutation.mutateAsync(newEntry);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add manga:', error);
    }
  };

  const handleClose = () => {
    if (!addMutation.isPending) {
      resetForm();
      onOpenChange(false);
    }
  };

  const canSubmit = title.trim() && isReady && !addMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] md:max-h-[90dvh] flex flex-col overflow-hidden p-0 bg-card border-gold">
        {/* Fixed Header */}
        <DialogHeader className="px-6 py-4 border-b border-gold shrink-0 flex flex-row items-center justify-between">
          <DialogTitle className="text-gold">Add New Manga</DialogTitle>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={addMutation.isPending}
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
              {addMutation.isPending ? (
                <>
                  <Loader2 className="h-3 w-3 mr-2 animate-spin text-gold" />
                  <span className="text-gold">Adding...</span>
                </>
              ) : (
                <span className="text-gold">Add Manga</span>
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

        {/* Scrollable Body - deterministic scroll region with overscroll containment */}
        <div 
          className="flex-1 min-h-0 add-manga-dialog-scroll-body px-6"
          style={{ 
            maxHeight: '400px',
            overflowY: 'scroll',
            overscrollBehavior: 'contain'
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-gold">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter manga title"
                required
                disabled={addMutation.isPending || !isReady}
                className="border-gold text-gold placeholder:text-gold/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="alternate-title-1" className="text-gold">Alternate Title 1</Label>
                <Input
                  id="alternate-title-1"
                  value={alternateTitle1}
                  onChange={(e) => setAlternateTitle1(e.target.value)}
                  placeholder="Optional"
                  disabled={addMutation.isPending || !isReady}
                  className="border-gold text-gold placeholder:text-gold/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alternate-title-2" className="text-gold">Alternate Title 2</Label>
                <Input
                  id="alternate-title-2"
                  value={alternateTitle2}
                  onChange={(e) => setAlternateTitle2(e.target.value)}
                  placeholder="Optional"
                  disabled={addMutation.isPending || !isReady}
                  className="border-gold text-gold placeholder:text-gold/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gold">Genres</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newGenreInput}
                  onChange={(e) => setNewGenreInput(e.target.value)}
                  placeholder="Add new genre"
                  disabled={addMutation.isPending || !isReady}
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
                  disabled={!newGenreInput.trim() || addMutation.isPending || !isReady}
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
                disabled={addMutation.isPending || !isReady}
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
              <Label htmlFor="synopsis" className="text-gold">Synopsis</Label>
              <Textarea
                id="synopsis"
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                placeholder="Enter synopsis"
                rows={4}
                disabled={addMutation.isPending || !isReady}
                className="border-gold text-gold placeholder:text-gold/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="chapters-read" className="text-gold">Chapters Read</Label>
                <Input
                  id="chapters-read"
                  type="number"
                  min="0"
                  step="0.1"
                  value={chaptersRead}
                  onChange={(e) => setChaptersRead(e.target.value)}
                  disabled={addMutation.isPending || !isReady}
                  className="border-gold text-gold"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="available-chapters" className="text-gold">Available Chapters</Label>
                <Input
                  id="available-chapters"
                  type="number"
                  min="0"
                  step="0.1"
                  value={availableChapters}
                  onChange={(e) => setAvailableChapters(e.target.value)}
                  disabled={addMutation.isPending || !isReady}
                  className="border-gold text-gold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-gold">Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as 'incomplete' | 'complete')}
                  disabled={addMutation.isPending || !isReady}
                >
                  <SelectTrigger id="status" className="border-gold text-gold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incomplete" className="text-red-500">Incomplete</SelectItem>
                    <SelectItem value="complete" className="rainbow-text">Complete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rating" className="text-gold">Rating (0-10)</Label>
                <Input
                  id="rating"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  disabled={addMutation.isPending || !isReady}
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
