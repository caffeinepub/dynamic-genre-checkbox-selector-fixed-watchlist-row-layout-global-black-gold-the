import { useState, useEffect, useRef } from 'react';
import { MangaEntry } from '../../backend';
import { usePersistentPopupPosition } from '../../hooks/usePersistentPopupPosition';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { useCachedCoverImageUrl } from '../../hooks/useCachedCoverImageUrl';

interface CoverHoverPopupProps {
  manga: MangaEntry;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClose: () => void;
}

export function CoverHoverPopup({ manga, onMouseEnter, onMouseLeave, onClose }: CoverHoverPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [titleIndex, setTitleIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const { identity } = useInternetIdentity();

  const allTitles = [manga.title, ...manga.alternateTitles];
  const hasAlternateTitles = manga.alternateTitles.length > 0;
  const currentTitle = allTitles[titleIndex];

  const networkCoverUrl = manga.coverImages.length > 0 
    ? manga.coverImages[0].getDirectURL() 
    : '/assets/generated/cover-placeholder.dim_600x900.png';

  const principal = identity?.getPrincipal().toString();
  const coverUrl = useCachedCoverImageUrl(principal, manga.stableId, networkCoverUrl);

  const { position, updatePosition } = usePersistentPopupPosition(popupRef);

  const cycleTitle = () => {
    setTitleIndex((prev) => (prev + 1) % allTitles.length);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (popupRef.current && e.target === popupRef.current) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && popupRef.current) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      updatePosition(newX, newY);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div
      ref={popupRef}
      className="fixed z-50 bg-black border-2 border-gold rounded-lg shadow-gold-glow p-4 cursor-move"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        maxWidth: '350px',
        width: 'max-content',
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex flex-col gap-4" style={{ maxWidth: '318px' }}>
        {/* Cover Image */}
        <div className="flex items-center justify-center pointer-events-none">
          <img
            src={coverUrl}
            alt={manga.title}
            className="object-contain"
            style={{
              maxWidth: '100%',
              maxHeight: '500px',
              height: 'auto',
              width: 'auto',
            }}
          />
        </div>

        {/* Title Area with Cycle Button - Scrollable */}
        <div className="relative">
          <div 
            className="text-gold font-semibold text-base overflow-y-auto pr-8 pointer-events-auto"
            style={{
              maxHeight: '3em',
              lineHeight: '1.5em',
              wordBreak: 'break-word',
            }}
          >
            {currentTitle}
          </div>
          {hasAlternateTitles && (
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-0 right-0 h-6 w-6 p-0 pointer-events-auto hover:bg-gold/10 z-20"
              style={{ transform: 'translateY(-25px)' }}
              onClick={(e) => {
                e.stopPropagation();
                cycleTitle();
              }}
            >
              <ChevronRight className="h-4 w-4 text-green-500" />
            </Button>
          )}
        </div>

        {/* Synopsis Box - Scrollable */}
        <div 
          className="text-sm text-gold/90 overflow-y-auto pointer-events-auto"
          style={{
            width: '100%',
            maxWidth: '318px',
            height: '200px',
          }}
        >
          {manga.synopsis || 'No synopsis available.'}
        </div>
      </div>
    </div>
  );
}
