import React from 'react';
import { Search, Bookmark, Plus, AlignLeft, AlignCenter } from 'lucide-react';
import { GenreCheckboxGrid } from './GenreCheckboxGrid';

type CompletionFilter = 'all' | 'complete' | 'incomplete';

interface MangaListControlsProps {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  selectedGenres: string[];
  onGenresChange: (v: string[]) => void;
  availableGenres: string[];
  sortOption: string;
  onSortChange: (v: string) => void;
  showBookmarkedOnly: boolean;
  onBookmarkToggle: () => void;
  completionFilter: CompletionFilter;
  onCompletionFilterChange: (v: string) => void;
  alignment?: 'left' | 'center';
  onAlignmentChange?: (v: 'left' | 'center') => void;
  onAddManga: () => void;
  totalCount?: number;
}

const inputStyle: React.CSSProperties = {
  backgroundColor: '#0a0a0a',
  border: '1px solid #d4a017',
  color: '#d4a017',
  padding: '4px 8px',
  fontSize: '13px',
  outline: 'none',
  borderRadius: '2px',
};

const labelStyle: React.CSSProperties = {
  color: '#d4a017',
  fontSize: '12px',
  fontFamily: 'Cinzel, serif',
};

export default function MangaListControls({
  searchQuery,
  onSearchChange,
  selectedGenres,
  onGenresChange,
  availableGenres,
  sortOption,
  onSortChange,
  showBookmarkedOnly,
  onBookmarkToggle,
  completionFilter,
  onCompletionFilterChange,
  alignment,
  onAlignmentChange,
  onAddManga,
}: MangaListControlsProps) {
  const handleGenreToggle = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      onGenresChange(selectedGenres.filter((g) => g !== genre));
    } else {
      onGenresChange([...selectedGenres, genre]);
    }
  };

  return (
    <div className="space-y-3 p-3" style={{ backgroundColor: '#000000' }}>
      {/* Row 1: Search + Sort + Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-48">
          <Search size={14} style={{ color: '#d4a017', flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search titles..."
            style={{ ...inputStyle, flex: 1 }}
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <label style={labelStyle}>Sort:</label>
          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="title-asc">Title A→Z</option>
            <option value="title-desc">Title Z→A</option>
            <option value="rating-desc">Rating ↓</option>
            <option value="rating-asc">Rating ↑</option>
            <option value="chapters-desc">Chapters ↓</option>
            <option value="chapters-asc">Chapters ↑</option>
          </select>
        </div>

        {/* Completion Filter */}
        <div className="flex items-center gap-2">
          <label style={labelStyle}>Status:</label>
          <select
            value={completionFilter}
            onChange={(e) => onCompletionFilterChange(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="all">All</option>
            <option value="complete">Complete</option>
            <option value="incomplete">Incomplete</option>
          </select>
        </div>

        {/* Bookmark Toggle */}
        <button
          onClick={onBookmarkToggle}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-serif border transition-all"
          style={{
            borderColor: showBookmarkedOnly ? '#d4a017' : '#8a6a10',
            color: showBookmarkedOnly ? '#d4a017' : '#8a6a10',
            backgroundColor: showBookmarkedOnly ? 'rgba(212,160,23,0.1)' : 'transparent',
          }}
        >
          <Bookmark size={12} style={{ fill: showBookmarkedOnly ? '#d4a017' : 'none' }} />
          Bookmarked
        </button>

        {/* Alignment */}
        {onAlignmentChange && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onAlignmentChange('left')}
              className="p-1 border transition-all"
              style={{
                borderColor: alignment === 'left' ? '#d4a017' : '#8a6a10',
                color: alignment === 'left' ? '#d4a017' : '#8a6a10',
                backgroundColor: alignment === 'left' ? 'rgba(212,160,23,0.1)' : 'transparent',
              }}
              title="Left align"
            >
              <AlignLeft size={12} />
            </button>
            <button
              onClick={() => onAlignmentChange('center')}
              className="p-1 border transition-all"
              style={{
                borderColor: alignment === 'center' ? '#d4a017' : '#8a6a10',
                color: alignment === 'center' ? '#d4a017' : '#8a6a10',
                backgroundColor: alignment === 'center' ? 'rgba(212,160,23,0.1)' : 'transparent',
              }}
              title="Center align"
            >
              <AlignCenter size={12} />
            </button>
          </div>
        )}

        {/* Add Button */}
        <button
          onClick={onAddManga}
          className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-serif border transition-all ml-auto"
          style={{
            borderColor: '#d4a017',
            color: '#d4a017',
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(212,160,23,0.15)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 8px rgba(212,160,23,0.4)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
          }}
        >
          <Plus size={14} />
          Add Manga
        </button>
      </div>

      {/* Genre Filter */}
      {availableGenres.length > 0 && (
        <div>
          <label style={{ ...labelStyle, display: 'block', marginBottom: '6px' }}>
            Genres:
          </label>
          <GenreCheckboxGrid
            genres={availableGenres}
            selectedGenres={selectedGenres}
            onGenreToggle={handleGenreToggle}
          />
        </div>
      )}
    </div>
  );
}
