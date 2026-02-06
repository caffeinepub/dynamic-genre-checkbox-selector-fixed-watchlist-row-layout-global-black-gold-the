import { useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Filter, ChevronDown, Bookmark, Plus, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface MangaListControlsProps {
  titleSearch: string;
  onTitleSearchChange: (value: string) => void;
  synopsisSearch: string;
  onSynopsisSearchChange: (value: string) => void;
  notesSearch: string;
  onNotesSearchChange: (value: string) => void;
  selectedGenres: string[];
  onSelectedGenresChange: (genres: string[]) => void;
  availableGenres: string[];
  bookmarkedOnly: boolean;
  onBookmarkedOnlyChange: (value: boolean) => void;
  completedOnly: boolean;
  onCompletedOnlyChange: (value: boolean) => void;
  sortBy: 'title-asc' | 'title-desc' | 'rating-desc' | 'rating-asc';
  onSortByChange: (value: 'title-asc' | 'title-desc' | 'rating-desc' | 'rating-asc') => void;
  onAddManga: () => void;
  isBackendReady: boolean;
  watchlistAlignment: 'left' | 'center' | 'right';
  onWatchlistAlignmentChange: (value: 'left' | 'center' | 'right') => void;
}

export function MangaListControls({
  titleSearch,
  onTitleSearchChange,
  synopsisSearch,
  onSynopsisSearchChange,
  notesSearch,
  onNotesSearchChange,
  selectedGenres,
  onSelectedGenresChange,
  availableGenres,
  bookmarkedOnly,
  onBookmarkedOnlyChange,
  completedOnly,
  onCompletedOnlyChange,
  sortBy,
  onSortByChange,
  onAddManga,
  isBackendReady,
  watchlistAlignment,
  onWatchlistAlignmentChange,
}: MangaListControlsProps) {
  const [genrePopoverOpen, setGenrePopoverOpen] = useState(false);

  const handleGenreToggle = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      onSelectedGenresChange(selectedGenres.filter(g => g !== genre));
    } else {
      onSelectedGenresChange([...selectedGenres, genre]);
    }
  };

  const clearGenres = () => {
    onSelectedGenresChange([]);
  };

  const getAlignmentIcon = () => {
    if (watchlistAlignment === 'left') return <AlignLeft className="h-3.5 w-3.5" />;
    if (watchlistAlignment === 'right') return <AlignRight className="h-3.5 w-3.5" />;
    return <AlignCenter className="h-3.5 w-3.5" />;
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label htmlFor="title-search" className="text-xs">Search Title</Label>
          <Input
            id="title-search"
            placeholder="Filter by title..."
            value={titleSearch}
            onChange={(e) => onTitleSearchChange(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="synopsis-search" className="text-xs">Search Synopsis</Label>
          <Input
            id="synopsis-search"
            placeholder="Filter by synopsis..."
            value={synopsisSearch}
            onChange={(e) => onSynopsisSearchChange(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="notes-search" className="text-xs">Search Notes</Label>
          <Input
            id="notes-search"
            placeholder="Filter by notes..."
            value={notesSearch}
            onChange={(e) => onNotesSearchChange(e.target.value)}
            className="h-9"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Genre Filter</Label>
          <Popover open={genrePopoverOpen} onOpenChange={setGenrePopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[180px] h-9 justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5" />
                  {selectedGenres.length === 0
                    ? 'All Genres'
                    : `${selectedGenres.length} selected`}
                </span>
                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-3" align="start">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-xs">Select Genres</h4>
                  {selectedGenres.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearGenres}
                      className="h-auto p-1 text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                {availableGenres.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No genres available</p>
                ) : (
                  <div className="max-h-[280px] overflow-y-auto space-y-2">
                    {availableGenres.map((genre) => (
                      <div key={genre} className="flex items-center space-x-2">
                        <Checkbox
                          id={`filter-genre-${genre}`}
                          checked={selectedGenres.includes(genre)}
                          onCheckedChange={() => handleGenreToggle(genre)}
                        />
                        <label
                          htmlFor={`filter-genre-${genre}`}
                          className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {genre}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Bookmarked</Label>
          <Button
            variant={bookmarkedOnly ? "default" : "outline"}
            onClick={() => onBookmarkedOnlyChange(!bookmarkedOnly)}
            className="h-9 gap-2"
          >
            <Bookmark className={`h-3.5 w-3.5 ${bookmarkedOnly ? 'fill-current rainbow-glow' : ''}`} />
            {bookmarkedOnly ? 'Bookmarked' : 'All'}
          </Button>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Complete Only</Label>
          <div className="flex items-center h-9 px-3 border rounded-md bg-background">
            <Checkbox
              id="completed-only"
              checked={completedOnly}
              onCheckedChange={(checked) => onCompletedOnlyChange(checked === true)}
            />
            <label
              htmlFor="completed-only"
              className="ml-2 text-sm font-medium leading-none cursor-pointer"
            >
              Complete
            </label>
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="sort-by" className="text-xs">Sort By</Label>
          <Select value={sortBy} onValueChange={(value) => onSortByChange(value as 'title-asc' | 'title-desc' | 'rating-desc' | 'rating-asc')}>
            <SelectTrigger id="sort-by" className="w-[180px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title-asc">Title (A–Z)</SelectItem>
              <SelectItem value="title-desc">Title (Z–A)</SelectItem>
              <SelectItem value="rating-desc">Rating (High–Low)</SelectItem>
              <SelectItem value="rating-asc">Rating (Low–High)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Alignment</Label>
          <Select value={watchlistAlignment} onValueChange={(value) => onWatchlistAlignmentChange(value as 'left' | 'center' | 'right')}>
            <SelectTrigger className="w-[120px] h-9">
              <div className="flex items-center gap-2">
                {getAlignmentIcon()}
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">
                <div className="flex items-center gap-2">
                  <AlignLeft className="h-3.5 w-3.5" />
                  Left
                </div>
              </SelectItem>
              <SelectItem value="center">
                <div className="flex items-center gap-2">
                  <AlignCenter className="h-3.5 w-3.5" />
                  Center
                </div>
              </SelectItem>
              <SelectItem value="right">
                <div className="flex items-center gap-2">
                  <AlignRight className="h-3.5 w-3.5" />
                  Right
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs opacity-0">Add</Label>
          <Button 
            onClick={onAddManga}
            className="h-9 gap-2"
            disabled={!isBackendReady}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Manga
          </Button>
        </div>
      </div>
    </div>
  );
}
