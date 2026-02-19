import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Bookmark, Plus } from 'lucide-react';
import { GenreCheckboxGrid } from './GenreCheckboxGrid';

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
  return (
    <div className="space-y-3">
      {/* Search Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label htmlFor="title-search" className="text-xs text-gold">Search Title</Label>
          <Input
            id="title-search"
            type="text"
            placeholder="Search by title..."
            value={titleSearch}
            onChange={(e) => onTitleSearchChange(e.target.value)}
            className="h-8 text-sm border-gold text-gold placeholder:text-gold/50"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="synopsis-search" className="text-xs text-gold">Search Synopsis</Label>
          <Input
            id="synopsis-search"
            type="text"
            placeholder="Search synopsis..."
            value={synopsisSearch}
            onChange={(e) => onSynopsisSearchChange(e.target.value)}
            className="h-8 text-sm border-gold text-gold placeholder:text-gold/50"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="notes-search" className="text-xs text-gold">Search Notes</Label>
          <Input
            id="notes-search"
            type="text"
            placeholder="Search notes..."
            value={notesSearch}
            onChange={(e) => onNotesSearchChange(e.target.value)}
            className="h-8 text-sm border-gold text-gold placeholder:text-gold/50"
          />
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Bookmarked Only */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="bookmarked-only"
            checked={bookmarkedOnly}
            onCheckedChange={onBookmarkedOnlyChange}
            className="border-gold"
          />
          <Label htmlFor="bookmarked-only" className="text-xs text-gold cursor-pointer flex items-center gap-1">
            <Bookmark className="h-3 w-3 text-gold" />
            Bookmarked Only
          </Label>
        </div>

        {/* Completed Only */}
        <div className="flex items-center gap-2">
          <Checkbox
            id="completed-only"
            checked={completedOnly}
            onCheckedChange={onCompletedOnlyChange}
            className="border-gold"
          />
          <Label htmlFor="completed-only" className="text-xs text-gold cursor-pointer">
            Completed Only
          </Label>
        </div>

        {/* Sort By */}
        <div className="flex items-center gap-2">
          <Label htmlFor="sort-by" className="text-xs text-gold shrink-0">Sort:</Label>
          <Select value={sortBy} onValueChange={onSortByChange}>
            <SelectTrigger id="sort-by" className="h-8 w-[140px] text-xs border-gold text-gold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title-asc" className="text-gold">Title A–Z</SelectItem>
              <SelectItem value="title-desc" className="text-gold">Title Z–A</SelectItem>
              <SelectItem value="rating-desc" className="text-gold">Rating High–Low</SelectItem>
              <SelectItem value="rating-asc" className="text-gold">Rating Low–High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Watchlist Alignment */}
        <div className="flex items-center gap-2">
          <Label htmlFor="alignment" className="text-xs text-gold shrink-0">Align:</Label>
          <Select value={watchlistAlignment} onValueChange={onWatchlistAlignmentChange}>
            <SelectTrigger id="alignment" className="h-8 w-[100px] text-xs border-gold text-gold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left" className="text-gold">Left</SelectItem>
              <SelectItem value="center" className="text-gold">Center</SelectItem>
              <SelectItem value="right" className="text-gold">Right</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Add Manga Button */}
        <Button
          onClick={onAddManga}
          disabled={!isBackendReady}
          size="sm"
          className="ml-auto h-8 text-xs"
        >
          <Plus className="h-3 w-3 mr-1 text-gold" />
          <span className="text-gold">Add Manga</span>
        </Button>
      </div>

      {/* Genre Filter */}
      {availableGenres.length > 0 && (
        <div className="space-y-1">
          <Label className="text-xs text-gold">Filter by Genre</Label>
          <GenreCheckboxGrid
            genres={availableGenres}
            selectedGenres={selectedGenres}
            onGenreToggle={(genre) => {
              if (selectedGenres.includes(genre)) {
                onSelectedGenresChange(selectedGenres.filter(g => g !== genre));
              } else {
                onSelectedGenresChange([...selectedGenres, genre]);
              }
            }}
            disabled={false}
          />
        </div>
      )}
    </div>
  );
}
