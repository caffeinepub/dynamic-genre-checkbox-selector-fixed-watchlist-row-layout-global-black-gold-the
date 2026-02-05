import { useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Filter, ChevronDown } from 'lucide-react';

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
  sortBy: 'title' | 'rating';
  onSortByChange: (value: 'title' | 'rating') => void;
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
  sortBy,
  onSortByChange,
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

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title-search">Search Title</Label>
          <Input
            id="title-search"
            placeholder="Filter by title..."
            value={titleSearch}
            onChange={(e) => onTitleSearchChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="synopsis-search">Search Synopsis</Label>
          <Input
            id="synopsis-search"
            placeholder="Filter by synopsis..."
            value={synopsisSearch}
            onChange={(e) => onSynopsisSearchChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes-search">Search Notes</Label>
          <Input
            id="notes-search"
            placeholder="Filter by notes..."
            value={notesSearch}
            onChange={(e) => onNotesSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label>Genre Filter</Label>
          <Popover open={genrePopoverOpen} onOpenChange={setGenrePopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-between">
                <span className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  {selectedGenres.length === 0
                    ? 'All Genres'
                    : `${selectedGenres.length} selected`}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-4" align="start">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Select Genres</h4>
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
                  <p className="text-sm text-muted-foreground">No genres available</p>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {availableGenres.map((genre) => (
                      <div key={genre} className="flex items-center space-x-2">
                        <Checkbox
                          id={`filter-genre-${genre}`}
                          checked={selectedGenres.includes(genre)}
                          onCheckedChange={() => handleGenreToggle(genre)}
                        />
                        <label
                          htmlFor={`filter-genre-${genre}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
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

        <div className="space-y-2">
          <Label>Bookmarked Only</Label>
          <div className="flex items-center space-x-2 h-10">
            <Checkbox
              id="bookmarked-filter"
              checked={bookmarkedOnly}
              onCheckedChange={(checked) => onBookmarkedOnlyChange(checked as boolean)}
            />
            <label
              htmlFor="bookmarked-filter"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Show only bookmarked
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sort-by">Sort By</Label>
          <Select value={sortBy} onValueChange={(value) => onSortByChange(value as 'title' | 'rating')}>
            <SelectTrigger id="sort-by" className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title">Title (A–Z)</SelectItem>
              <SelectItem value="rating">Rating (High–Low)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
