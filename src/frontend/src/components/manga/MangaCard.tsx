import { useState } from 'react';
import { MangaEntry } from '../../backend';
import { Badge } from '../ui/badge';
import { Star, BookOpen, CheckCircle2, Circle, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';

interface MangaCardProps {
  manga: MangaEntry;
}

export function MangaCard({ manga }: MangaCardProps) {
  const [titleIndex, setTitleIndex] = useState(0);
  
  const coverUrl = manga.coverImages.length > 0 
    ? manga.coverImages[0].getDirectURL() 
    : '/assets/generated/cover-placeholder.dim_600x900.png';

  const chaptersRead = Number(manga.chaptersRead);
  const availableChapters = Number(manga.availableChapters);
  const progress = availableChapters > 0 ? (chaptersRead / availableChapters) * 100 : 0;

  // Build array of all titles (primary + alternates)
  const allTitles = [manga.title, ...manga.alternateTitles];
  const hasAlternateTitles = manga.alternateTitles.length > 0;
  const currentTitle = allTitles[titleIndex];

  const cycleTitle = () => {
    setTitleIndex((prev) => (prev + 1) % allTitles.length);
  };

  return (
    <div className="w-[900px] h-[78px] shrink-0 bg-black border-2 border-gold rounded-lg flex items-center overflow-hidden shadow-gold-glow">
      {/* Cover Image - 70px width (doubled from 35px) */}
      <div className="w-[70px] h-full shrink-0 flex items-center justify-center bg-muted overflow-hidden">
        <img 
          src={coverUrl} 
          alt={manga.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Title - 250px max width with cycle button */}
      <div className="w-[250px] shrink-0 px-3 overflow-hidden relative">
        <h3 className="text-gold font-semibold text-sm truncate pr-6">{currentTitle}</h3>
        {hasAlternateTitles && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-0 right-0 h-5 w-5 p-0 hover:bg-transparent"
            onClick={cycleTitle}
          >
            <ChevronRight className="h-4 w-4 text-green-500" />
          </Button>
        )}
      </div>

      {/* Rating */}
      <div className="flex items-center gap-1.5 px-3 shrink-0">
        <Star className="h-3.5 w-3.5 fill-gold text-gold" />
        <span className="text-gold font-semibold text-sm">{manga.rating.toFixed(1)}</span>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 px-3 shrink-0">
        <BookOpen className="h-3.5 w-3.5 text-gold" />
        <span className="text-gold text-sm font-medium">
          {chaptersRead} / {availableChapters}
        </span>
        <div className="w-20 bg-muted rounded-full h-1.5">
          <div 
            className="bg-gold h-1.5 rounded-full transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Completion Status */}
      <div className="px-3 shrink-0">
        {manga.completed ? (
          <Badge variant="outline" className="gap-1 border-gold text-gold bg-transparent">
            <CheckCircle2 className="h-3 w-3" />
            Complete
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1 border-gold text-gold bg-transparent">
            <Circle className="h-3 w-3" />
            Reading
          </Badge>
        )}
      </div>

      {/* Genres */}
      {manga.genres.length > 0 && (
        <div className="flex flex-wrap gap-1 px-3 flex-1 overflow-hidden">
          {manga.genres.slice(0, 3).map((genre, i) => (
            <Badge key={i} variant="outline" className="text-xs border-gold text-gold bg-transparent">
              {genre}
            </Badge>
          ))}
          {manga.genres.length > 3 && (
            <Badge variant="outline" className="text-xs border-gold text-gold bg-transparent">
              +{manga.genres.length - 3}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
