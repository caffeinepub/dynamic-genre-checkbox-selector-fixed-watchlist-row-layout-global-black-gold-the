import React, { useState, useCallback, memo } from 'react';
import type { MangaEntry } from '../../backend';
import MangaCard from './MangaCard';
import EditMangaDialog from './EditMangaDialog';
import EditNotesDialog from './EditNotesDialog';
import { useDeleteMangaEntry } from '../../hooks/useMangaMutations';
import { Edit2, Trash2, FileText } from 'lucide-react';

interface MangaRowActionsProps {
  entry: MangaEntry;
  uniformWidth?: number | null;
  registerRow?: (el: HTMLElement | null) => void;
  alignment?: 'left' | 'center';
  currentPage: number;
}

const MangaRowActions = memo(function MangaRowActions({
  entry,
  uniformWidth,
  registerRow,
  alignment = 'left',
  currentPage,
}: MangaRowActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const deleteEntry = useDeleteMangaEntry(currentPage);

  const handleDelete = useCallback(() => {
    if (window.confirm(`Delete "${entry.title}"?`)) {
      deleteEntry.mutate(entry.stableId);
    }
  }, [deleteEntry, entry.stableId, entry.title]);

  const handleEditOpen = useCallback(() => setEditOpen(true), []);
  const handleEditClose = useCallback((open: boolean) => setEditOpen(open), []);
  const handleNotesOpen = useCallback(() => setNotesOpen(true), []);
  const handleNotesClose = useCallback((open: boolean) => setNotesOpen(open), []);

  return (
    <div
      ref={registerRow}
      className="flex items-stretch w-full"
      style={{
        justifyContent: alignment === 'center' ? 'center' : 'flex-start',
      }}
    >
      {/* Card */}
      <div className="flex-1 min-w-0">
        <MangaCard
          entry={entry}
          width={uniformWidth ?? undefined}
          alignment={alignment}
        />
      </div>

      {/* Action Buttons */}
      <div
        className="flex-shrink-0 flex flex-col items-center justify-center gap-1 px-1"
        style={{ backgroundColor: '#000000' }}
      >
        <button
          onClick={handleEditOpen}
          className="p-1.5 transition-colors"
          style={{ color: '#8a6a10', background: 'none', border: 'none', cursor: 'pointer' }}
          title="Edit entry"
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#d4a017';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#8a6a10';
          }}
        >
          <Edit2 size={14} />
        </button>
        <button
          onClick={handleNotesOpen}
          className="p-1.5 transition-colors"
          style={{ color: '#8a6a10', background: 'none', border: 'none', cursor: 'pointer' }}
          title="Edit notes"
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#d4a017';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#8a6a10';
          }}
        >
          <FileText size={14} />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleteEntry.isPending}
          className="p-1.5 transition-colors disabled:opacity-50"
          style={{ color: '#8a6a10', background: 'none', border: 'none', cursor: 'pointer' }}
          title="Delete entry"
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#cc3333';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#8a6a10';
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Dialogs */}
      {editOpen && (
        <EditMangaDialog
          entry={entry}
          open={editOpen}
          onOpenChange={handleEditClose}
          currentPage={currentPage}
        />
      )}
      {notesOpen && (
        <EditNotesDialog
          entry={entry}
          open={notesOpen}
          onOpenChange={handleNotesClose}
        />
      )}
    </div>
  );
});

export default MangaRowActions;
