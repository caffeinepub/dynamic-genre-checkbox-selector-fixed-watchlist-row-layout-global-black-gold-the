import { Loader2, Save, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import type { ExternalBlob, MangaEntry, UpdateFields } from "../../backend";
import { useLibraryGenres } from "../../hooks/useLibraryGenres";
import { useUpdateMangaEntry } from "../../hooks/useMangaMutations";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { CoverImagesField } from "./CoverImagesField";
import { GenreCheckboxGrid } from "./GenreCheckboxGrid";

interface EditMangaDialogProps {
  entry: MangaEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPage: number;
}

const inputStyle: React.CSSProperties = {
  backgroundColor: "#0a0a0a",
  border: "1px solid #d4a017",
  color: "#d4a017",
  padding: "6px 10px",
  fontSize: "13px",
  outline: "none",
  borderRadius: "2px",
  width: "100%",
};

const labelStyle: React.CSSProperties = {
  color: "#d4a017",
  fontSize: "12px",
  fontFamily: "Cinzel, serif",
  display: "block",
  marginBottom: "4px",
};

export default function EditMangaDialog({
  entry,
  open,
  onOpenChange,
  currentPage,
}: EditMangaDialogProps) {
  const { genres: libraryGenres } = useLibraryGenres();
  const updateEntry = useUpdateMangaEntry(currentPage);

  const [title, setTitle] = useState(entry.title);
  const [alternateTitles, setAlternateTitles] = useState<string[]>(
    entry.alternateTitles,
  );
  const [altTitleInput, setAltTitleInput] = useState("");
  const [synopsis, setSynopsis] = useState(entry.synopsis);
  const [chaptersRead, setChaptersRead] = useState(String(entry.chaptersRead));
  const [availableChapters, setAvailableChapters] = useState(
    String(entry.availableChapters),
  );
  const [rating, setRating] = useState(String(entry.rating));
  const [completed, setCompleted] = useState(entry.completed);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(entry.genres);
  const [coverImages, setCoverImages] = useState<ExternalBlob[]>(
    entry.coverImages,
  );
  const [newGenreInput, setNewGenreInput] = useState("");

  // Sync state when entry changes
  useEffect(() => {
    setTitle(entry.title);
    setAlternateTitles(entry.alternateTitles);
    setSynopsis(entry.synopsis);
    setChaptersRead(String(entry.chaptersRead));
    setAvailableChapters(String(entry.availableChapters));
    setRating(String(entry.rating));
    setCompleted(entry.completed);
    setSelectedGenres(entry.genres);
    setCoverImages(entry.coverImages);
  }, [entry]);

  const handleAddAltTitle = () => {
    if (altTitleInput.trim()) {
      setAlternateTitles((prev) => [...prev, altTitleInput.trim()]);
      setAltTitleInput("");
    }
  };

  const handleRemoveAltTitle = (idx: number) => {
    setAlternateTitles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre],
    );
  };

  const handleAddNewGenre = () => {
    const g = newGenreInput.trim();
    if (g && !selectedGenres.includes(g)) {
      setSelectedGenres((prev) => [...prev, g]);
    }
    setNewGenreInput("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Only send changed fields
    const updates: UpdateFields = { stableId: entry.stableId };
    if (title.trim() !== entry.title) updates.title = title.trim();
    if (
      JSON.stringify(alternateTitles) !== JSON.stringify(entry.alternateTitles)
    )
      updates.alternateTitles = alternateTitles;
    if (synopsis !== entry.synopsis) updates.synopsis = synopsis;
    const parsedChaptersRead = Number.parseFloat(chaptersRead) || 0;
    if (parsedChaptersRead !== entry.chaptersRead)
      updates.chaptersRead = parsedChaptersRead;
    const parsedAvailableChapters = Number.parseFloat(availableChapters) || 0;
    if (parsedAvailableChapters !== entry.availableChapters)
      updates.availableChapters = parsedAvailableChapters;
    const parsedRating = Number.parseFloat(rating) || 0;
    if (parsedRating !== entry.rating) updates.rating = parsedRating;
    if (completed !== entry.completed) updates.completed = completed;
    if (JSON.stringify(selectedGenres) !== JSON.stringify(entry.genres))
      updates.genres = selectedGenres;
    if (coverImages !== entry.coverImages) updates.coverImages = coverImages;

    await updateEntry.mutateAsync({ stableId: entry.stableId, updates });
    onOpenChange(false);
  };

  const allAvailableGenres = Array.from(
    new Set([...libraryGenres, ...selectedGenres]),
  ).sort();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg flex flex-col"
        style={{
          backgroundColor: "#0a0a0a",
          border: "1px solid #d4a017",
          color: "#d4a017",
          maxHeight: "90vh",
          padding: 0,
        }}
      >
        {/* Fixed Header */}
        <DialogHeader
          className="px-4 py-3 flex-shrink-0"
          style={{ borderBottom: "1px solid #d4a017" }}
        >
          <div className="flex items-center justify-between">
            <DialogTitle
              className="font-serif text-lg"
              style={{ color: "#d4a017" }}
            >
              Edit Manga Entry
            </DialogTitle>
            <div className="flex items-center gap-2">
              <button
                form="edit-manga-form"
                type="submit"
                disabled={!title.trim() || updateEntry.isPending}
                className="text-xs px-3 py-1 border font-serif transition-all disabled:opacity-50 flex items-center gap-1"
                style={{
                  borderColor: "#d4a017",
                  color: "#d4a017",
                  backgroundColor: "transparent",
                }}
              >
                {updateEntry.isPending ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={12} />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Body */}
        <div
          className="overflow-y-auto flex-1"
          style={{ maxHeight: "400px", overscrollBehavior: "contain" }}
        >
          <form
            id="edit-manga-form"
            onSubmit={handleSubmit}
            className="p-4 space-y-4"
          >
            {/* Title */}
            <div>
              <label htmlFor="edit-title" style={labelStyle}>
                Title *
              </label>
              <input
                id="edit-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={inputStyle}
                required
              />
            </div>

            {/* Alternate Titles */}
            <div>
              <label htmlFor="edit-alt-title" style={labelStyle}>
                Alternate Titles
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  id="edit-alt-title"
                  type="text"
                  value={altTitleInput}
                  onChange={(e) => setAltTitleInput(e.target.value)}
                  placeholder="Add alternate title..."
                  style={{ ...inputStyle, flex: 1 }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddAltTitle();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddAltTitle}
                  className="px-2 py-1 border text-xs font-serif"
                  style={{
                    borderColor: "#d4a017",
                    color: "#d4a017",
                    backgroundColor: "transparent",
                  }}
                >
                  Add
                </button>
              </div>
              {alternateTitles.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {alternateTitles.map((t, i) => {
                    const altKey = `${t}-${i}`;
                    return (
                      <span
                        key={altKey}
                        className="flex items-center gap-1 text-xs px-2 py-0.5"
                        style={{
                          border: "1px solid #8a6a10",
                          color: "#8a6a10",
                        }}
                      >
                        {t}
                        <button
                          type="button"
                          onClick={() => handleRemoveAltTitle(i)}
                          style={{
                            color: "#8a6a10",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          <X size={10} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Synopsis */}
            <div>
              <label htmlFor="edit-synopsis" style={labelStyle}>
                Synopsis
              </label>
              <textarea
                id="edit-synopsis"
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            {/* Chapters */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="edit-chapters-read" style={labelStyle}>
                  Chapters Read
                </label>
                <input
                  id="edit-chapters-read"
                  type="number"
                  value={chaptersRead}
                  onChange={(e) => setChaptersRead(e.target.value)}
                  style={inputStyle}
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <label htmlFor="edit-total-chapters" style={labelStyle}>
                  Total Chapters
                </label>
                <input
                  id="edit-total-chapters"
                  type="number"
                  value={availableChapters}
                  onChange={(e) => setAvailableChapters(e.target.value)}
                  style={inputStyle}
                  min="0"
                  step="0.1"
                />
              </div>
            </div>

            {/* Rating */}
            <div>
              <label htmlFor="edit-rating" style={labelStyle}>
                Rating (0–10)
              </label>
              <input
                id="edit-rating"
                type="number"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                style={inputStyle}
                min="0"
                max="10"
                step="0.1"
              />
            </div>

            {/* Completed */}
            <div className="flex items-center gap-3">
              <span style={labelStyle}>Status:</span>
              <label
                htmlFor="edit-completed"
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  id="edit-completed"
                  type="checkbox"
                  checked={completed}
                  onChange={(e) => setCompleted(e.target.checked)}
                  style={{ accentColor: "#d4a017" }}
                />
                <span
                  className="text-xs font-serif"
                  style={{ color: "#d4a017" }}
                >
                  Completed
                </span>
              </label>
            </div>

            {/* Genres */}
            <div>
              <label htmlFor="edit-new-genre" style={labelStyle}>
                Genres
              </label>
              {allAvailableGenres.length > 0 && (
                <div className="mb-2">
                  <GenreCheckboxGrid
                    genres={allAvailableGenres}
                    selectedGenres={selectedGenres}
                    onGenreToggle={handleGenreToggle}
                  />
                </div>
              )}
              <div className="flex gap-2">
                <input
                  id="edit-new-genre"
                  type="text"
                  value={newGenreInput}
                  onChange={(e) => setNewGenreInput(e.target.value)}
                  placeholder="Add new genre..."
                  style={{ ...inputStyle, flex: 1 }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddNewGenre();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddNewGenre}
                  className="px-2 py-1 border text-xs font-serif"
                  style={{
                    borderColor: "#d4a017",
                    color: "#d4a017",
                    backgroundColor: "transparent",
                  }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Cover Images */}
            <div>
              <span style={labelStyle}>Cover Images</span>
              <CoverImagesField
                coverImages={coverImages}
                onChange={setCoverImages}
              />
            </div>

            {updateEntry.isError && (
              <p className="text-sm" style={{ color: "#cc4444" }}>
                {updateEntry.error instanceof Error
                  ? updateEntry.error.message
                  : "Failed to update entry. Please try again."}
              </p>
            )}
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
