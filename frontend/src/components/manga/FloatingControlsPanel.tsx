import React, { useState } from 'react';
import MangaListControls from './MangaListControls';
import { ChevronUp, ChevronDown } from 'lucide-react';

type CompletionFilter = 'all' | 'complete' | 'incomplete';

interface FloatingControlsPanelProps {
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

export default function FloatingControlsPanel(props: FloatingControlsPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="mb-4 sticky top-16 z-40"
      style={{
        backgroundColor: '#000000',
        border: '1px solid #d4a017',
        boxShadow: '0 2px 12px rgba(212,160,23,0.15)',
      }}
    >
      {/* Panel Header */}
      <div
        className="flex items-center justify-between px-3 py-1.5 cursor-pointer"
        style={{ borderBottom: collapsed ? 'none' : '1px solid #8a6a10' }}
        onClick={() => setCollapsed((p) => !p)}
      >
        <span className="text-xs font-serif" style={{ color: '#8a6a10' }}>
          Filters & Controls
          {props.totalCount !== undefined && (
            <span style={{ color: '#d4a017' }}> · {props.totalCount} entries</span>
          )}
        </span>
        <button
          className="p-0.5"
          style={{ color: '#8a6a10', background: 'none', border: 'none', cursor: 'pointer' }}
          aria-label={collapsed ? 'Expand controls' : 'Collapse controls'}
        >
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {/* Panel Content */}
      {!collapsed && <MangaListControls {...props} />}
    </div>
  );
}
