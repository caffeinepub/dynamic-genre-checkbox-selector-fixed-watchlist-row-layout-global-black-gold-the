import { useState, useEffect, RefObject } from 'react';

const STORAGE_KEY = 'cover-popup-position';

interface Position {
  x: number;
  y: number;
}

function getStoredPosition(): Position | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load popup position:', error);
  }
  return null;
}

function savePosition(position: Position) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
  } catch (error) {
    console.error('Failed to save popup position:', error);
  }
}

function getCenteredPosition(popupWidth: number, popupHeight: number): Position {
  return {
    x: (window.innerWidth - popupWidth) / 2,
    y: (window.innerHeight - popupHeight) / 2,
  };
}

function clampPosition(x: number, y: number, popupWidth: number, popupHeight: number): Position {
  const maxX = window.innerWidth - popupWidth;
  const maxY = window.innerHeight - popupHeight;
  
  return {
    x: Math.max(0, Math.min(x, maxX)),
    y: Math.max(0, Math.min(y, maxY)),
  };
}

export function usePersistentPopupPosition(popupRef: RefObject<HTMLDivElement | null>) {
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!popupRef.current || initialized) return;

    const popupWidth = popupRef.current.offsetWidth || 400;
    const popupHeight = popupRef.current.offsetHeight || 600;

    const storedPosition = getStoredPosition();
    
    if (storedPosition) {
      const clamped = clampPosition(storedPosition.x, storedPosition.y, popupWidth, popupHeight);
      setPosition(clamped);
    } else {
      const centered = getCenteredPosition(popupWidth, popupHeight);
      setPosition(centered);
      savePosition(centered);
    }

    setInitialized(true);
  }, [popupRef.current, initialized]);

  useEffect(() => {
    const handleResize = () => {
      if (!popupRef.current) return;
      
      const popupWidth = popupRef.current.offsetWidth;
      const popupHeight = popupRef.current.offsetHeight;
      
      const clamped = clampPosition(position.x, position.y, popupWidth, popupHeight);
      
      if (clamped.x !== position.x || clamped.y !== position.y) {
        setPosition(clamped);
        savePosition(clamped);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position, popupRef.current]);

  const updatePosition = (x: number, y: number) => {
    if (!popupRef.current) return;
    
    const popupWidth = popupRef.current.offsetWidth;
    const popupHeight = popupRef.current.offsetHeight;
    
    const clamped = clampPosition(x, y, popupWidth, popupHeight);
    setPosition(clamped);
    savePosition(clamped);
  };

  return { position, updatePosition };
}
