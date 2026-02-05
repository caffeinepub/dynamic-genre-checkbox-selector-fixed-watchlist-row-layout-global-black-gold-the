import { useState } from 'react';
import { useAddMangaEntry } from '../../hooks/useMangaMutations';
import { useBackendConnection } from '../../hooks/useBackendConnection';
import { useLibraryGenres } from '../../hooks/useLibraryGenres';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { CoverImagesField } from './CoverImagesField';
import { ExternalBlob } from '../../backend';

interface AddMangaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPage: number;
}

export function AddMangaDialog({ open, onOpenChange, currentPage }: AddMangaDialogProps) {
  const { isReady, isConnecting, isFailed, errorMessage, errorCategory } = useBackendConnection();
  const addMutation = useAddMangaEntry(currentPage);
  const { genres: libraryGenres } = useLibraryGenres();

  const [title, setTitle] = useState('');
  const [alternateTitles, setAlternateTitles] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [customGenre, setCustomGenre] = useState('');
  const [coverImages, setCoverImages] = useState<ExternalBlob[]>([]);
  const [synopsis, setSynopsis] = useState('');
  const [chaptersRead, setChaptersRead] = useState('0');
  const [availableChapters, setAvailableChapters] = useState('0');
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState('0');
  const [completed, setCompleted] = useState(false);

  const resetForm = () => {
    setTitle('');
    setAlternateTitles('');
    setSelectedGenres([]);
    setCustomGenre('');
    setCoverImages([]);
    setSynopsis('');
    setChaptersRead('0');
    setAvailableChapters('0');
    setNotes('');
    setRating('0');
    setCompleted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isReady) {
      return;
    }

    const alternateTitlesArray = alternateTitles
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const allGenres = [...selectedGenres];
    if (customGenre.trim()) {
      allGenres.push(customGenre.trim());
    }

    const manga = {
      title,
      alternateTitles: alternateTitlesArray,
      genres: allGenres,
      coverImages,
      synopsis,
      chaptersRead: BigInt(chaptersRead),
      availableChapters: BigInt(availableChapters),
      notes,
      bookmarks: [],
      rating: parseFloat(rating),
      completed,
    };

    try {
      await addMutation.mutateAsync({ id: Date.now().toString(), manga });
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add manga:', error);
    }
  };

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const isFormDisabled = !isReady || addMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle>Add New Manga</DialogTitle>
        </DialogHeader>

        {!isReady && (
          <div className="px-6 py-2 shrink-0">
            {isConnecting ? (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  Connecting to backend...
                </AlertDescription>
              </Alert>
            ) : isFailed ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {errorCategory === 'timeout' 
                    ? 'Connection timed out. Please close and retry.'
                    : errorMessage || 'Backend not ready. Please wait or retry connection.'}
                </AlertDescription>
              </Alert>
            ) : null}
          </div>
        )}

        <ScrollArea className="flex-1 px-6 min-h-0" style={{ maxHeight: '400px' }}>
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isFormDisabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alternateTitles">Alternate Titles (comma-separated)</Label>
              <Input
                id="alternateTitles"
                value={alternateTitles}
                onChange={(e) => setAlternateTitles(e.target.value)}
                placeholder="e.g., Title 2, Title 3"
                disabled={isFormDisabled}
              />
            </div>

            <div className="space-y-2">
              <Label>Genres</Label>
              {libraryGenres.length > 0 && (
                <div className="grid grid-cols-2 gap-2 p-3 border rounded-md">
                  {libraryGenres.map((genre) => (
                    <div key={genre} className="flex items-center space-x-2">
                      <Checkbox
                        id={`genre-${genre}`}
                        checked={selectedGenres.includes(genre)}
                        onCheckedChange={() => handleGenreToggle(genre)}
                        disabled={isFormDisabled}
                      />
                      <label
                        htmlFor={`genre-${genre}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {genre}
                      </label>
                    </div>
                  ))}
                </div>
              )}
              <Input
                placeholder="Add custom genre"
                value={customGenre}
                onChange={(e) => setCustomGenre(e.target.value)}
                disabled={isFormDisabled}
              />
            </div>

            <CoverImagesField
              coverImages={coverImages}
              onChange={setCoverImages}
            />

            <div className="space-y-2">
              <Label htmlFor="synopsis">Synopsis</Label>
              <Textarea
                id="synopsis"
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                rows={4}
                disabled={isFormDisabled}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="chaptersRead">Chapters Read</Label>
                <Input
                  id="chaptersRead"
                  type="number"
                  min="0"
                  value={chaptersRead}
                  onChange={(e) => setChaptersRead(e.target.value)}
                  disabled={isFormDisabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="availableChapters">Available Chapters</Label>
                <Input
                  id="availableChapters"
                  type="number"
                  min="0"
                  value={availableChapters}
                  onChange={(e) => setAvailableChapters(e.target.value)}
                  disabled={isFormDisabled}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                disabled={isFormDisabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating">Rating (0-10)</Label>
              <Input
                id="rating"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                disabled={isFormDisabled}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="completed"
                checked={completed}
                onCheckedChange={(checked) => setCompleted(checked as boolean)}
                disabled={isFormDisabled}
              />
              <Label htmlFor="completed">Completed</Label>
            </div>
          </form>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={addMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isFormDisabled}
          >
            {addMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Manga'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
