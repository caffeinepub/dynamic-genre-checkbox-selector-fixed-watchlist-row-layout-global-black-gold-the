import React from "react";

interface GenreCheckboxGridProps {
  genres: string[];
  selectedGenres: string[];
  onGenreToggle: (genre: string) => void;
  disabled?: boolean;
}

export function GenreCheckboxGrid({
  genres,
  selectedGenres,
  onGenreToggle,
  disabled = false,
}: GenreCheckboxGridProps) {
  if (genres.length === 0) {
    return (
      <p className="text-xs italic" style={{ color: "#8a6a10" }}>
        No genres available yet. Add genres when creating manga entries.
      </p>
    );
  }

  // Split into rows of 3
  const rows: string[][] = [];
  for (let i = 0; i < genres.length; i += 3) {
    rows.push(genres.slice(i, i + 3));
  }

  return (
    <div className="space-y-1">
      {rows.map((row, rowIdx) => {
        const rowKey = `row-${row[0] ?? rowIdx}`;
        return (
          <div
            key={rowKey}
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${row.length}, 1fr)`,
              gap: "8px",
            }}
          >
            {row.map((genre) => {
              const isSelected = selectedGenres.includes(genre);
              return (
                <label
                  key={genre}
                  className="flex items-center gap-1.5 cursor-pointer text-xs"
                  style={{
                    color: isSelected ? "#d4a017" : "#8a6a10",
                    opacity: disabled ? 0.5 : 1,
                    cursor: disabled ? "not-allowed" : "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => !disabled && onGenreToggle(genre)}
                    disabled={disabled}
                    style={{ accentColor: "#d4a017" }}
                  />
                  <span className="font-serif truncate">{genre}</span>
                </label>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
