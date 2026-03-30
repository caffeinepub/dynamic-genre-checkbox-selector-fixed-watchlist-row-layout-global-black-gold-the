import { useEffect, useState, useCallback, useRef } from 'react';

interface UseUniformWatchlistRowWidthReturn {
  uniformWidth: number | null;
  registerRow: (element: HTMLElement | null) => void;
}

export function useUniformWatchlistRowWidth(
  dependencies: any[] = []
): UseUniformWatchlistRowWidthReturn {
  const [uniformWidth, setUniformWidth] = useState<number | null>(null);
  const rowElementsRef = useRef<Set<HTMLElement>>(new Set());
  const measureTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const registerRow = useCallback((element: HTMLElement | null) => {
    if (element) {
      rowElementsRef.current.add(element);
    }
    // Note: We don't remove on null because React may call with null during updates
    // Cleanup happens in the measurement phase by checking isConnected
  }, []);

  const measureWidths = useCallback(() => {
    // Clean up stale elements
    const connectedElements = new Set<HTMLElement>();
    rowElementsRef.current.forEach((element) => {
      if (element && element.isConnected) {
        connectedElements.add(element);
      }
    });
    rowElementsRef.current = connectedElements;

    if (rowElementsRef.current.size === 0) {
      setUniformWidth(null);
      return;
    }

    let maxWidth = 0;
    rowElementsRef.current.forEach((element) => {
      const firstChild = element.firstElementChild as HTMLElement;
      if (firstChild) {
        const width = firstChild.scrollWidth;
        if (width > maxWidth) {
          maxWidth = width;
        }
      }
    });
    
    if (maxWidth > 0) {
      setUniformWidth(maxWidth);
    }
  }, []);

  const scheduleMeasure = useCallback(() => {
    if (measureTimeoutRef.current) {
      clearTimeout(measureTimeoutRef.current);
    }
    measureTimeoutRef.current = setTimeout(() => {
      requestAnimationFrame(measureWidths);
    }, 50);
  }, [measureWidths]);

  // Clear row elements when dependencies change (e.g., pagination, filters)
  useEffect(() => {
    rowElementsRef.current.clear();
    setUniformWidth(null);
  }, dependencies);

  // Set up measurement and observers
  useEffect(() => {
    if (rowElementsRef.current.size === 0) {
      setUniformWidth(null);
      return;
    }

    // Initial measurement
    scheduleMeasure();

    // Set up ResizeObserver to handle dynamic changes
    const resizeObserver = new ResizeObserver(() => {
      scheduleMeasure();
    });
    resizeObserverRef.current = resizeObserver;

    // Observe all row elements and their children
    rowElementsRef.current.forEach((element) => {
      if (element && element.isConnected) {
        const firstChild = element.firstElementChild as HTMLElement;
        if (firstChild) {
          resizeObserver.observe(firstChild);
        }
      }
    });

    // Listen for image load events to re-measure when covers finish loading
    const handleImageLoad = () => {
      scheduleMeasure();
    };

    rowElementsRef.current.forEach((element) => {
      const images = element.querySelectorAll('img');
      images.forEach((img) => {
        if (!img.complete) {
          img.addEventListener('load', handleImageLoad, { once: true });
        }
      });
    });

    // Listen for window resize
    const handleResize = () => {
      scheduleMeasure();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (measureTimeoutRef.current) {
        clearTimeout(measureTimeoutRef.current);
      }
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      
      // Clean up image listeners
      rowElementsRef.current.forEach((element) => {
        const images = element.querySelectorAll('img');
        images.forEach((img) => {
          img.removeEventListener('load', handleImageLoad);
        });
      });
    };
  }, [scheduleMeasure]);

  return { uniformWidth, registerRow };
}
