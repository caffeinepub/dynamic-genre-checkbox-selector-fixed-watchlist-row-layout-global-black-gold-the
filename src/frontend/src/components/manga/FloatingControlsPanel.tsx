import { useState } from 'react';
import { Button } from '../ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { MangaListControls } from './MangaListControls';

interface FloatingControlsPanelProps {
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

export function FloatingControlsPanel(props: FloatingControlsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="sticky top-4 z-40 mb-6">
      <div className="bg-card border-2 border-gold rounded-lg shadow-gold-glow overflow-hidden">
        <div className="flex items-center justify-between p-2 bg-black border-b border-gold">
          <h3 className="text-gold font-semibold text-sm">Filters & Search</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 text-gold hover:bg-gold/10"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        {isExpanded && (
          <div className="p-2">
            <MangaListControls {...props} />
          </div>
        )}
      </div>
    </div>
  );
}
