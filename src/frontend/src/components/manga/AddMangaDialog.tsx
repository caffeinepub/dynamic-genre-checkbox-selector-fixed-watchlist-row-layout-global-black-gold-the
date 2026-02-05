import { useState } from 'react';
import { useAddMangaEntry } from '../../hooks/useMangaMutations';
import { useLibraryGenres } from '../../hooks/useLibraryGenres';
import { useActor } from '../../hooks/useActor';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { CoverImagesField } from './CoverImagesField';
import { ExternalBlob } from '../../backend';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Alert, AlertDescription } from '../ui/alert';

interface AddMangaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPage: number;
}

export function AddMangaDialog({ open, onOpenChange, currentPage }: AddMangaDialogProps) {
  const [title, setTitle] = useState('');
  const [alternateTitles, setAlternateTitles] = useState<string[]>(['']);
  const [synopsis, setSynopsis] = useState('');
  const [genres, setGenres] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());
  const [coverImages, setCoverImages] = useState<ExternalBlob[]>([]);
  const [chaptersRead, setChaptersRead] = useState('0');
  const [availableChapters, setAvailableChapters] = useState('0');
  const [notes, setNotes] = useState('');
  const [bookmarks, setBookmarks] = useState('');
  const [rating, setRating] = useState('5.0');
  const [completed, setCompleted] = useState('incomplete');
  const [errorMessage, setErrorMessage] = useState('');

  const { actor, isFetching: actorFetching } = useActor();
  const addManga = useAddMangaEntry(currentPage);
  const { genres: libraryGenres } = useLibraryGenres();

  const isActorReady = !!actor && !actorFetching;

  const resetForm = () => {
    setTitle('');
    setAlternateTitles(['']);
    setSynopsis('');
    setGenres('');
    setSelectedGenres(new Set());
    setCoverImages([]);
    setChaptersRead('0');
    setAvailableChapters('0');
    setNotes('');
    setBookmarks('');
    setRating('5.0');
    setCompleted('incomplete');
    setErrorMessage('');
  };

  const toggleGenre = (genre: string) => {
    const newSelected = new Set(selectedGenres);
    if (newSelected.has(genre)) {
      newSelected.delete(genre);
    } else {
      newSelected.add(genre);
    }
    setSelectedGenres(newSelected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent submission if actor is not ready
    if (!isActorReady) {
      setErrorMessage('Please wait while connecting to the backend...');
      return;
    }

    // Prevent double submission
    if (addManga.isPending) {
      return;
    }

    // Clear any previous error
    setErrorMessage('');

    // Validate rating
    const ratingValue = parseFloat(rating);
    if (isNaN(ratingValue) || ratingValue < 1.0 || ratingValue > 10.0) {
      setErrorMessage('Rating must be between 1.0 and 10.0');
      return;
    }

    // Validate rating step (0.5 increments)
    if ((ratingValue * 10) % 5 !== 0) {
      setErrorMessage('Rating must be in increments of 0.5 (e.g., 7.5, 8.0)');
      return;
    }

    // Parse chapters
    const chaptersReadNum = parseInt(chaptersRead) || 0;
    const availableChaptersNum = parseInt(availableChapters) || 0;

    if (chaptersReadNum < 0 || availableChaptersNum < 0) {
      setErrorMessage('Chapter counts cannot be negative');
      return;
    }

    // Parse manually entered genres
    const manualGenreList = genres
      .split(',')
      .map(g => g.trim())
      .filter(g => g.length > 0);

    // Combine selected checkbox genres with manual genres, remove duplicates
    const allGenres = Array.from(new Set([...Array.from(selectedGenres), ...manualGenreList]));

    // Parse bookmarks
    const bookmarkList = bookmarks
      .split(',')
      .map(b => parseInt(b.trim()))
      .filter(b => !isNaN(b) && b >= 0);

    // Filter out empty alternate titles and limit to 4
    const filteredAlternateTitles = alternateTitles
      .map(t => t.trim())
      .filter(t => t.length > 0)
      .slice(0, 4);

    const id = `manga-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      await addManga.mutateAsync({
        id,
        manga: {
          title: title.trim(),
          alternateTitles: filteredAlternateTitles,
          synopsis: synopsis.trim(),
          genres: allGenres,
          coverImages,
          chaptersRead: BigInt(chaptersReadNum),
          availableChapters: BigInt(availableChaptersNum),
          notes: notes.trim(),
          bookmarks: bookmarkList.map(b => BigInt(b)),
          rating: ratingValue,
          completed: completed === 'complete',
        },
      });

      // Only reset and close on success
      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      // Show user-friendly error message and keep dialog open
      const errorMsg = error?.message || 'Failed to add manga. Please try again.';
      setErrorMessage(errorMsg);
      console.error('Error adding manga:', error);
    }
  };

  const addAlternateTitle = () => {
    if (alternateTitles.length < 4) {
      setAlternateTitles([...alternateTitles, '']);
    }
  };

  const removeAlternateTitle = (index: number) => {
    setAlternateTitles(alternateTitles.filter((_, i) => i !== index));
  };

  const updateAlternateTitle = (index: number, value: string) => {
    const updated = [...alternateTitles];
    updated[index] = value;
    setAlternateTitles(updated);
  };

  // Clear error when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setErrorMessage('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add New Manga</DialogTitle>
          <DialogDescription>
            Fill in the details for your manga entry. All fields are optional except the title.
          </DialogDescription>
        </DialogHeader>

        {!isActorReady && (
          <Alert className="mt-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>Connecting to backend...</AlertDescription>
          </Alert>
        )}

        {errorMessage && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <form id="add-manga-form" onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4 pb-2">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter manga title"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Alternate Titles (max 4)</Label>
                <div className="space-y-2 mt-1">
                  {alternateTitles.map((altTitle, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={altTitle}
                        onChange={(e) => updateAlternateTitle(index, e.target.value)}
                        placeholder={`Alternate title ${index + 1}`}
                      />
                      {alternateTitles.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeAlternateTitle(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {alternateTitles.length < 4 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addAlternateTitle}
                    >
                      Add Alternate Title
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="synopsis">Synopsis</Label>
                <Textarea
                  id="synopsis"
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  placeholder="Enter a brief synopsis"
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="genres">Genres (comma-separated)</Label>
                <Input
                  id="genres"
                  value={genres}
                  onChange={(e) => setGenres(e.target.value)}
                  placeholder="e.g., Action, Adventure, Fantasy"
                  className="mt-1"
                />
              </div>

              {libraryGenres.length > 0 && (
                <div>
                  <Label>Select from existing genres</Label>
                  <ScrollArea className="h-32 mt-2 rounded-md border p-3">
                    <div className="space-y-2">
                      {libraryGenres.map((genre) => (
                        <div key={genre} className="flex items-center space-x-2">
                          <Checkbox
                            id={`genre-${genre}`}
                            checked={selectedGenres.has(genre)}
                            onCheckedChange={() => toggleGenre(genre)}
                          />
                          <label
                            htmlFor={`genre-${genre}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {genre}
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <CoverImagesField
                coverImages={coverImages}
                onChange={setCoverImages}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="chaptersRead">Chapters Read</Label>
                  <Input
                    id="chaptersRead"
                    type="number"
                    min="0"
                    value={chaptersRead}
                    onChange={(e) => setChaptersRead(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="availableChapters">Available Chapters</Label>
                  <Input
                    id="availableChapters"
                    type="number"
                    min="0"
                    value={availableChapters}
                    onChange={(e) => setAvailableChapters(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="rating">Rating (1.0 - 10.0, step 0.5)</Label>
                <Input
                  id="rating"
                  type="number"
                  min="1.0"
                  max="10.0"
                  step="0.5"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="completed">Completion Status</Label>
                <Select value={completed} onValueChange={setCompleted}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incomplete">Incomplete</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bookmarks">Bookmarks (comma-separated chapter numbers)</Label>
                <Input
                  id="bookmarks"
                  value={bookmarks}
                  onChange={(e) => setBookmarks(e.target.value)}
                  placeholder="e.g., 5, 12, 23"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Personal notes about this manga"
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4 pt-4 border-t bg-background">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={addManga.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="add-manga-form"
              disabled={!title.trim() || !isActorReady || addManga.isPending}
            >
              {addManga.isPending ? 'Adding...' : 'Add Manga'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
