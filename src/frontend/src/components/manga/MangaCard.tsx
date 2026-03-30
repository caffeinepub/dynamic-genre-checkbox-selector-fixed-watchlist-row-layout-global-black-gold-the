import { Bookmark, BookmarkCheck, Star } from "lucide-react";
import type React from "react";
import { useCallback, useState } from "react";
import type { MangaEntry } from "../../backend";
import { useCachedCoverImageUrl } from "../../hooks/useCachedCoverImageUrl";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import {
  useToggleBookmark,
  useUpdateChapterProgress,
} from "../../hooks/useMangaMutations";
import { formatChapterNumber } from "../../utils/formatChapterNumber";
import { AutoScrollTitle } from "./AutoScrollTitle";
import CoverHoverPopup from "./CoverHoverPopup";
import NotesPreviewOverlay from "./NotesPreviewOverlay";

interface MangaCardProps {
  entry: MangaEntry;
  width?: number;
}

export default function MangaCard({ entry, width }: MangaCardProps) {
  const [showNotesOverlay, setShowNotesOverlay] = useState(false);
  const [notesAnchorRect, setNotesAnchorRect] = useState<DOMRect | null>(null);
  const [showCoverPopup, setShowCoverPopup] = useState(false);
  const [titleIndex, setTitleIndex] = useState(0);
  const [editingChapters, setEditingChapters] = useState(false);
  const [chaptersValue, setChaptersValue] = useState("");

  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString();

  const toggleBookmark = useToggleBookmark();
  const updateChapterProgress = useUpdateChapterProgress();

  const networkCoverUrl =
    entry.coverImages && entry.coverImages.length > 0
      ? entry.coverImages[0].getDirectURL()
      : "/assets/generated/cover-placeholder.dim_600x900.png";

  // useCachedCoverImageUrl(principal, stableId, networkUrl)
  const coverUrl = useCachedCoverImageUrl(
    principal,
    entry.stableId,
    networkCoverUrl,
  );

  const allTitles = [entry.title, ...entry.alternateTitles].filter(Boolean);
  const currentTitle = allTitles[titleIndex] ?? entry.title;

  const handleTitleCycle = useCallback(() => {
    if (allTitles.length > 1) {
      setTitleIndex((prev) => (prev + 1) % allTitles.length);
    }
  }, [allTitles.length]);

  const handleBookmarkToggle = useCallback(() => {
    toggleBookmark.mutate(entry.stableId);
  }, [toggleBookmark, entry.stableId]);

  const handleNotesMouseEnter = useCallback(
    (e: React.MouseEvent) => {
      if (entry.notes?.trim()) {
        setNotesAnchorRect(
          (e.currentTarget as HTMLElement).getBoundingClientRect(),
        );
        setShowNotesOverlay(true);
      }
    },
    [entry.notes],
  );

  const handleNotesMouseLeave = useCallback(() => {
    setShowNotesOverlay(false);
    setNotesAnchorRect(null);
  }, []);

  const handleCoverClick = useCallback(() => {
    setShowCoverPopup(true);
  }, []);

  const handleChaptersClick = useCallback(() => {
    setEditingChapters(true);
    setChaptersValue(formatChapterNumber(entry.chaptersRead));
  }, [entry.chaptersRead]);

  const handleChaptersBlur = useCallback(() => {
    const parsed = Number.parseFloat(chaptersValue);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      updateChapterProgress.mutate({
        stableId: entry.stableId,
        chaptersRead: parsed,
        availableChapters: entry.availableChapters,
      });
    }
    setEditingChapters(false);
  }, [
    chaptersValue,
    entry.stableId,
    entry.availableChapters,
    updateChapterProgress,
  ]);

  const handleChaptersKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        (e.currentTarget as HTMLInputElement).blur();
      } else if (e.key === "Escape") {
        setEditingChapters(false);
      }
    },
    [],
  );

  const isComplete = entry.completed;
  const hasHighRating = entry.rating >= 8.0;

  const cardStyle: React.CSSProperties = {
    width: width ? `${width}px` : "100%",
    backgroundColor: "#0a0a0a",
    border: "1px solid #d4a017",
    color: "#d4a017",
    display: "flex",
    alignItems: "stretch",
    minHeight: "72px",
    position: "relative",
    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
  };

  return (
    <>
      <div
        style={cardStyle}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.animation = "rainbow-border-shift 3s linear infinite";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.animation = "";
          el.style.borderColor = "#d4a017";
          el.style.boxShadow = "none";
        }}
      >
        {/* Cover Image */}
        <button
          type="button"
          className="flex-shrink-0 cursor-pointer overflow-hidden"
          style={{
            width: "48px",
            minHeight: "72px",
            padding: 0,
            border: "none",
            background: "none",
          }}
          onClick={handleCoverClick}
        >
          <img
            src={coverUrl}
            alt={entry.title}
            className="w-full h-full object-cover"
            style={{ minHeight: "72px" }}
          />
        </button>

        {/* Main Content */}
        <div className="flex-1 min-w-0 flex items-center px-3 gap-3">
          {/* Title */}
          <div className="flex-1 min-w-0" style={{ maxWidth: "280px" }}>
            <AutoScrollTitle
              title={currentTitle}
              onClick={handleTitleCycle}
              className="text-sm font-serif"
            />
          </div>

          {/* Status */}
          <div className="flex-shrink-0 w-24 text-center">
            {isComplete ? (
              <span className="text-xs font-serif rainbow-text">Complete</span>
            ) : (
              <span className="text-xs font-serif" style={{ color: "#cc3333" }}>
                Incomplete
              </span>
            )}
          </div>

          {/* Chapters */}
          <div className="flex-shrink-0 w-28 text-center">
            {editingChapters ? (
              <input
                type="number"
                value={chaptersValue}
                onChange={(e) => setChaptersValue(e.target.value)}
                onBlur={handleChaptersBlur}
                onKeyDown={handleChaptersKeyDown}
                className="w-16 text-center text-xs px-1 py-0.5 outline-none"
                style={{
                  backgroundColor: "#0a0a0a",
                  border: "1px solid #d4a017",
                  color: "#d4a017",
                  borderRadius: "2px",
                }}
                // biome-ignore lint/a11y/noAutofocus: intentional focus for inline editing
                autoFocus
                step="0.1"
                min="0"
              />
            ) : (
              <button
                type="button"
                onClick={handleChaptersClick}
                className="text-xs font-serif hover:underline"
                style={{
                  color: "#d4a017",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
                title="Click to edit chapters read"
              >
                {formatChapterNumber(entry.chaptersRead)}
                {entry.availableChapters > 0 && (
                  <span style={{ color: "#8a6a10" }}>
                    /{formatChapterNumber(entry.availableChapters)}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Rating */}
          <div className="flex-shrink-0 w-20 flex items-center justify-center gap-1">
            <Star size={12} style={{ color: "#d4a017", fill: "#d4a017" }} />
            <span
              className={`text-xs font-serif ${hasHighRating ? "rainbow-text" : ""}`}
              style={hasHighRating ? {} : { color: "#d4a017" }}
            >
              {entry.rating > 0 ? entry.rating.toFixed(1) : "—"}
            </span>
          </div>

          {/* Genres */}
          <div className="flex-shrink-0 w-32 hidden md:flex flex-wrap gap-1">
            {entry.genres.slice(0, 2).map((genre) => (
              <span
                key={genre}
                className="text-xs px-1 py-0.5"
                style={{
                  border: "1px solid #8a6a10",
                  color: "#8a6a10",
                  fontSize: "10px",
                }}
              >
                {genre}
              </span>
            ))}
            {entry.genres.length > 2 && (
              <span
                className="text-xs"
                style={{ color: "#8a6a10", fontSize: "10px" }}
              >
                +{entry.genres.length - 2}
              </span>
            )}
          </div>

          {/* Notes indicator */}
          {entry.notes?.trim() && (
            <div
              className="flex-shrink-0 cursor-pointer"
              onMouseEnter={handleNotesMouseEnter}
              onMouseLeave={handleNotesMouseLeave}
            >
              <span
                className="text-xs px-1.5 py-0.5"
                style={{
                  border: "1px solid #d4a017",
                  color: "#d4a017",
                  fontSize: "10px",
                }}
              >
                Notes
              </span>
            </div>
          )}
        </div>

        {/* Bookmark */}
        <div className="flex-shrink-0 flex items-center px-2">
          <button
            type="button"
            onClick={handleBookmarkToggle}
            disabled={toggleBookmark.isPending}
            className="p-1 transition-colors disabled:opacity-50"
            style={{ background: "none", border: "none", cursor: "pointer" }}
            title={entry.isBookmarked ? "Remove bookmark" : "Add bookmark"}
          >
            {entry.isBookmarked ? (
              <BookmarkCheck
                size={16}
                style={{ color: "#d4a017", fill: "#d4a017" }}
              />
            ) : (
              <Bookmark size={16} style={{ color: "#8a6a10" }} />
            )}
          </button>
        </div>
      </div>

      {/* Notes Overlay */}
      {showNotesOverlay && notesAnchorRect && (
        <NotesPreviewOverlay notes={entry.notes} anchorRect={notesAnchorRect} />
      )}

      {/* Cover Popup */}
      {showCoverPopup && (
        <CoverHoverPopup
          entry={entry}
          onClose={() => setShowCoverPopup(false)}
          onTitleCycle={handleTitleCycle}
          titleIndex={titleIndex}
        />
      )}
    </>
  );
}
