import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { MangaEntry } from '../../backend';
import { useCachedCoverImageUrl } from '../../hooks/useCachedCoverImageUrl';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { X, ChevronRight } from 'lucide-react';
import { AutoScrollTitle } from './AutoScrollTitle';

interface CoverHoverPopupProps {
  entry: MangaEntry;
  onClose: () => void;
  onTitleCycle?: () => void;
  titleIndex?: number;
}

export default function CoverHoverPopup({
  entry,
  onClose,
  onTitleCycle,
  titleIndex = 0,
}: CoverHoverPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString();

  const networkCoverUrl =
    entry.coverImages && entry.coverImages.length > 0
      ? entry.coverImages[0].getDirectURL()
      : '/assets/generated/cover-placeholder.dim_600x900.png';

  // useCachedCoverImageUrl requires (principal, stableId, networkUrl)
  const cachedUrl = useCachedCoverImageUrl(principal, entry.stableId, networkCoverUrl);

  const allTitles = [entry.title, ...entry.alternateTitles].filter(Boolean);
  const currentTitle = allTitles[titleIndex] ?? entry.title;

  // Center on mount
  useEffect(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    setPosition({
      x: Math.max(0, (vw - 320) / 2),
      y: Math.max(0, (vh - 480) / 2),
    });
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    e.preventDefault();
  }, [position]);

  useEffect(() => {
    if (!dragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 320, e.clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.current.y)),
      });
    };
    const handleMouseUp = () => setDragging(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging]);

  return createPortal(
    <div
      ref={popupRef}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 10000,
        width: '320px',
        backgroundColor: '#0a0a0a',
        border: '1px solid #d4a017',
        boxShadow: '0 8px 32px rgba(212,160,23,0.3)',
        cursor: dragging ? 'grabbing' : 'grab',
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: '1px solid #8a6a10' }}
      >
        <div className="flex-1 min-w-0 flex items-center gap-1">
          <div className="flex-1 min-w-0">
            <AutoScrollTitle
              title={currentTitle}
              className="text-sm font-serif"
            />
          </div>
          {allTitles.length > 1 && onTitleCycle && (
            <button
              onClick={onTitleCycle}
              className="flex-shrink-0 p-0.5"
              style={{
                color: '#8a6a10',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transform: 'translateY(-25px)',
                zIndex: 1,
              }}
              title="Cycle title"
            >
              <ChevronRight size={14} />
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 ml-2"
          style={{ color: '#8a6a10', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Cover Image */}
      <div style={{ height: '280px', overflow: 'hidden' }}>
        <img
          src={cachedUrl}
          alt={entry.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          draggable={false}
        />
      </div>

      {/* Synopsis */}
      {entry.synopsis && (
        <div
          className="px-3 py-2 overflow-y-auto"
          style={{ maxHeight: '120px', borderTop: '1px solid #8a6a10' }}
        >
          <p className="text-xs leading-relaxed" style={{ color: '#8a6a10' }}>
            {entry.synopsis}
          </p>
        </div>
      )}

      {/* Stats */}
      <div
        className="px-3 py-2 flex items-center gap-4 text-xs font-serif"
        style={{ borderTop: '1px solid #8a6a10', color: '#8a6a10' }}
      >
        <span>
          Rating:{' '}
          <span style={{ color: '#d4a017' }}>
            {entry.rating > 0 ? entry.rating.toFixed(1) : '—'}
          </span>
        </span>
        <span>
          Ch:{' '}
          <span style={{ color: '#d4a017' }}>
            {entry.chaptersRead}
            {entry.availableChapters > 0 && `/${entry.availableChapters}`}
          </span>
        </span>
        <span style={{ color: entry.completed ? '#d4a017' : '#cc3333' }}>
          {entry.completed ? 'Complete' : 'Incomplete'}
        </span>
      </div>
    </div>,
    document.body
  );
}
