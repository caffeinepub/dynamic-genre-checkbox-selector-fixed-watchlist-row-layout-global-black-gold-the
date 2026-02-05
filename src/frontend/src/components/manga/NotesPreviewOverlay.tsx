import { createPortal } from 'react-dom';

interface NotesPreviewOverlayProps {
  notes: string;
  visible: boolean;
}

export function NotesPreviewOverlay({ notes, visible }: NotesPreviewOverlayProps) {
  if (!visible || !notes.trim()) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="notes-preview-overlay bg-amber-50 border-2 border-gold rounded-lg p-4 max-w-md max-h-[400px] overflow-auto shadow-gold-glow">
        <p className="text-blue-900 text-sm whitespace-pre-wrap">{notes}</p>
      </div>
    </div>,
    document.body
  );
}
