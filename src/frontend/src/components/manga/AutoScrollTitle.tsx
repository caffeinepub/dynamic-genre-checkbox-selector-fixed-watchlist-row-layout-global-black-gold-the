import { useState, useEffect, useRef } from 'react';

interface AutoScrollTitleProps {
  title: string;
  className?: string;
}

export function AutoScrollTitle({ title, className = '' }: AutoScrollTitleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && contentRef.current) {
        const containerHeight = containerRef.current.clientHeight;
        const contentHeight = contentRef.current.scrollHeight;
        setShouldScroll(contentHeight > containerHeight);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [title]);

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden h-full ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={contentRef}
        className={`text-gold font-medium text-sm ${shouldScroll ? 'animate-scroll-vertical-bottom-to-top' : ''} ${isPaused ? 'paused' : ''}`}
        style={{
          whiteSpace: 'normal',
          wordWrap: 'break-word',
        }}
      >
        {title}
      </div>
    </div>
  );
}
