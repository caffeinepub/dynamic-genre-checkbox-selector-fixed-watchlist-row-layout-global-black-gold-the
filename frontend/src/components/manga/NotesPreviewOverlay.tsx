import React from 'react';
import { createPortal } from 'react-dom';

interface NotesPreviewOverlayProps {
  notes: string;
  anchorRect: DOMRect;
}

export default function NotesPreviewOverlay({ notes, anchorRect }: NotesPreviewOverlayProps) {
  const top = anchorRect.bottom + window.scrollY + 8;
  const left = anchorRect.left + window.scrollX;

  return createPortal(
    <div
      style={{
        position: 'absolute',
        top,
        left,
        zIndex: 9999,
        maxWidth: '320px',
        minWidth: '200px',
        backgroundColor: '#f5f0e8',
        border: '1px solid #d4a017',
        padding: '10px 12px',
        boxShadow: '0 4px 16px rgba(212,160,23,0.3)',
        pointerEvents: 'none',
      }}
    >
      <p
        className="text-xs leading-relaxed"
        style={{ color: '#1a1a2e', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
      >
        {notes}
      </p>
    </div>,
    document.body
  );
}
