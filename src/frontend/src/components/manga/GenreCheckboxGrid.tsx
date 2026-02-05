import { useEffect, useRef, useState } from 'react';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';

interface GenreCheckboxGridProps {
  genres: string[];
  selectedGenres: string[];
  onGenreToggle: (genre: string) => void;
  disabled?: boolean;
}

export function GenreCheckboxGrid({ genres, selectedGenres, onGenreToggle, disabled }: GenreCheckboxGridProps) {
  const [rowWidths, setRowWidths] = useState<number[]>([]);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Chunk genres into rows of 3
  const rows: string[][] = [];
  for (let i = 0; i < genres.length; i += 3) {
    rows.push(genres.slice(i, i + 3));
  }

  useEffect(() => {
    // Measure each row and find the max width per row
    const newRowWidths: number[] = [];
    
    rows.forEach((row, rowIndex) => {
      let maxWidth = 0;
      row.forEach((_, colIndex) => {
        const itemIndex = rowIndex * 3 + colIndex;
        const element = itemRefs.current[itemIndex];
        if (element) {
          const width = element.offsetWidth;
          if (width > maxWidth) {
            maxWidth = width;
          }
        }
      });
      newRowWidths.push(maxWidth);
    });

    setRowWidths(newRowWidths);
  }, [genres, rows.length]);

  if (genres.length === 0) {
    return (
      <div className="p-3 border rounded-md text-sm text-muted-foreground">
        No genres available. Add a new genre above.
      </div>
    );
  }

  return (
    <div className="p-3 border rounded-md space-y-2">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-3 gap-2">
          {row.map((genre, colIndex) => {
            const itemIndex = rowIndex * 3 + colIndex;
            const rowWidth = rowWidths[rowIndex];
            
            return (
              <div
                key={genre}
                ref={(el) => {
                  itemRefs.current[itemIndex] = el;
                }}
                className="flex items-center space-x-2"
                style={rowWidth ? { minWidth: `${rowWidth}px` } : undefined}
              >
                <Checkbox
                  id={`genre-${genre}-${itemIndex}`}
                  checked={selectedGenres.includes(genre)}
                  onCheckedChange={() => onGenreToggle(genre)}
                  disabled={disabled}
                />
                <Label
                  htmlFor={`genre-${genre}-${itemIndex}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {genre}
                </Label>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
