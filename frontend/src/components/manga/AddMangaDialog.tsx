import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { useAddMangaEntry } from '../../hooks/useMangaMutations';
import { CoverImagesField } from './CoverImagesField';
import { GenreCheckboxGrid } from './GenreCheckboxGrid';
import { useLibraryGenres } from '../../hooks/useLibraryGenres';
import { Loader2, Plus, X } from 'lucide-react';
import type { ExternalBlob } from '../../backend';

interface AddMangaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPage: number;
}

const inputStyle: React.CSSProperties = {
  backgroundColor: '#0a0a0a',
  border: '1px solid #d4a017',
  color: '#d4a017',
  padding: '6px 10px',
  fontSize: '13px',
  outline: 'none',
  borderRadius: '2px',
  width: '100%',
};

const labelStyle: React.CSSProperties = {
  color: '#d4a017',
  fontSize: '12px',
  fontFamily: 'Cinzel, serif',
  display: 'block',
  marginBottom: '4px',
};

export default function AddMangaDialog({ open, onOpenChange, currentPage }: AddMangaDialogProps) {
  const { genres: libraryGenres } = useLibraryGenres();
  const addEntry = useAddMangaEntry(currentPage);

  const [title, setTitle] = useState('');
  const [alternateTitles, setAlternateTitles] = useState<string[]>([]);
  const [altTitleInput, setAltTitleInput] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [chaptersRead, setChaptersRead] = useState('');
  const [availableChapters, setAvailableChapters] = useState('');
  const [rating, setRating] = useState('');
  const [completed, setCompleted] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [coverImages, setCoverImages] = useState<ExternalBlob[]>([]);
  const [newGenreInput, setNewGenreInput] = useState('');

  const scrollBodyRef = useRef<HTMLDivElement>(null);

  const handleAddAltTitle = () => {
    if (altTitleInput.trim()) {
      setAlternateTitles((prev) => [...prev, altTitleInput.trim()]);
      setAltTitleInput('');
    }
  };

  const handleRemoveAltTitle = (idx: number) => {
    setAlternateTitles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleAddNewGenre = () => {
    const g = newGenreInput.trim();
    if (g && !selectedGenres.includes(g)) {
      setSelectedGenres((prev) => [...prev, g]);
    }
    setNewGenreInput('');
  };

  const handleReset = () => {
    setTitle('');
    setAlternateTitles([]);
    setAltTitleInput('');
    setSynopsis('');
    setChaptersRead('');
    setAvailableChapters('');
    setRating('');
    setCompleted(false);
    setSelectedGenres([]);
    setCoverImages([]);
    setNewGenreInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const stableId = BigInt(Date.now());
    await addEntry.mutateAsync({
      stableId,
      title: title.trim(),
      alternateTitles,
      synopsis,
      chaptersRead: parseFloat(chaptersRead) || 0,
      availableChapters: parseFloat(availableChapters) || 0,
      rating: parseFloat(rating) || 0,
      completed,
      genres: selectedGenres,
      coverImages,
      notes: '',
      bookmarks: [],
      isBookmarked: false,
    });

    handleReset();
    onOpenChange(false);
  };

  const allAvailableGenres = Array.from(
    new Set([...libraryGenres, ...selectedGenres])
  ).sort();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg flex flex-col"
        style={{
          backgroundColor: '#0a0a0a',
          border: '1px solid #d4a017',
          color: '#d4a017',
          maxHeight: '90vh',
          padding: 0,
        }}
      >
        {/* Fixed Header */}
        <DialogHeader
          className="px-4 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid #d4a017' }}
        >
          <div className="flex items-center justify-between">
            <DialogTitle className="font-serif text-lg" style={{ color: '#d4a017' }}>
              Add Manga Entry
            </DialogTitle>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs px-2 py-1 border font-serif transition-all"
                style={{
                  borderColor: '#8a6a10',
                  color: '#8a6a10',
                  backgroundColor: 'transparent',
                }}
              >
                Reset
              </button>
              <button
                form="add-manga-form"
                type="submit"
                disabled={!title.trim() || addEntry.isPending}
                className="text-xs px-3 py-1 border font-serif transition-all disabled:opacity-50 flex items-center gap-1"
                style={{
                  borderColor: '#d4a017',
                  color: '#d4a017',
                  backgroundColor: 'transparent',
                }}
              >
                {addEntry.isPending ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus size={12} />
                    Add
                  </>
                )}
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Body */}
        <div
          ref={scrollBodyRef}
          className="scroll-body overflow-y-auto flex-1"
          style={{ maxHeight: '400px', overscrollBehavior: 'contain' }}
        >
          <form id="add-manga-form" onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Title */}
            <div>
              <label style={labelStyle}>Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Manga title..."
                style={inputStyle}
                required
              />
            </div>

            {/* Alternate Titles */}
            <div>
              <label style={labelStyle}>Alternate Titles</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={altTitleInput}
                  onChange={(e) => setAltTitleInput(e.target.value)}
                  placeholder="Add alternate title..."
                  style={{ ...inputStyle, flex: 1 }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAltTitle();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddAltTitle}
                  className="px-2 py-1 border text-xs font-serif"
                  style={{ borderColor: '#d4a017', color: '#d4a017', backgroundColor: 'transparent' }}
                >
                  Add
                </button>
              </div>
              {alternateTitles.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {alternateTitles.map((t, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1 text-xs px-2 py-0.5"
                      style={{ border: '1px solid #8a6a10', color: '#8a6a10' }}
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => handleRemoveAltTitle(i)}
                        style={{ color: '#8a6a10', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Synopsis */}
            <div>
              <label style={labelStyle}>Synopsis</label>
              <textarea
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                placeholder="Brief description..."
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            {/* Chapters */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Chapters Read</label>
                <input
                  type="number"
                  value={chaptersRead}
                  onChange={(e) => setChaptersRead(e.target.value)}
                  placeholder="0"
                  style={inputStyle}
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <label style={labelStyle}>Total Chapters</label>
                <input
                  type="number"
                  value={availableChapters}
                  onChange={(e) => setAvailableChapters(e.target.value)}
                  placeholder="0"
                  style={inputStyle}
                  min="0"
                  step="0.1"
                />
              </div>
            </div>

            {/* Rating */}
            <div>
              <label style={labelStyle}>Rating (0–10)</label>
              <input
                type="number"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                placeholder="0.0"
                style={inputStyle}
                min="0"
                max="10"
                step="0.1"
              />
            </div>

            {/* Completed */}
            <div className="flex items-center gap-3">
              <label style={labelStyle}>Status:</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={completed}
                  onChange={(e) => setCompleted(e.target.checked)}
                  style={{ accentColor: '#d4a017' }}
                />
                <span className="text-xs font-serif" style={{ color: '#d4a017' }}>
                  Completed
                </span>
              </label>
            </div>

            {/* Genres */}
            <div>
              <label style={labelStyle}>Genres</label>
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
                  type="text"
                  value={newGenreInput}
                  onChange={(e) => setNewGenreInput(e.target.value)}
                  placeholder="Add new genre..."
                  style={{ ...inputStyle, flex: 1 }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddNewGenre();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddNewGenre}
                  className="px-2 py-1 border text-xs font-serif"
                  style={{ borderColor: '#d4a017', color: '#d4a017', backgroundColor: 'transparent' }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Cover Images */}
            <div>
              <label style={labelStyle}>Cover Images</label>
              <CoverImagesField
                coverImages={coverImages}
                onChange={setCoverImages}
              />
            </div>

            {addEntry.isError && (
              <p className="text-sm" style={{ color: '#cc4444' }}>
                {addEntry.error instanceof Error
                  ? addEntry.error.message
                  : 'Failed to add entry. Please try again.'}
              </p>
            )}
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
