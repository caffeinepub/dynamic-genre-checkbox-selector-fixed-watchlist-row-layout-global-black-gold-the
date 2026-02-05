import { MangaEntry } from '../../backend';
import { Badge } from '../ui/badge';
import { Star, BookOpen, CheckCircle2, Circle } from 'lucide-react';

interface MangaCardProps {
  manga: MangaEntry;
}

export function MangaCard({ manga }: MangaCardProps) {
  const coverUrl = manga.coverImages.length > 0 
    ? manga.coverImages[0].getDirectURL() 
    : '/assets/generated/cover-placeholder.dim_600x900.png';

  const chaptersRead = Number(manga.chaptersRead);
  const availableChapters = Number(manga.availableChapters);
  const progress = availableChapters > 0 ? (chaptersRead / availableChapters) * 100 : 0;

  return (
    <div className="w-[900px] h-[78px] shrink-0 bg-black border-2 border-gold rounded-lg flex items-center overflow-hidden shadow-gold-glow">
      {/* Cover Image - 35px max width */}
      <div className="w-[35px] h-full shrink-0 flex items-center justify-center bg-muted overflow-hidden">
        <img 
          src={coverUrl} 
          alt={manga.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Title - 250px max width */}
      <div className="w-[250px] shrink-0 px-3 overflow-hidden">
        <h3 className="text-gold font-semibold text-sm truncate">{manga.title}</h3>
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
