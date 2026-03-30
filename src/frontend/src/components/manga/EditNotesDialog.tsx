import { Loader2, Save } from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { MangaEntry } from "../../backend";
import { useBackendConnectionSingleton } from "../../hooks/useBackendConnectionSingleton";
import { useUpdateNotes } from "../../hooks/useMangaMutations";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

interface EditNotesDialogProps {
  entry: MangaEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditNotesDialog({
  entry,
  open,
  onOpenChange,
}: EditNotesDialogProps) {
  const [notes, setNotes] = useState(entry.notes);
  const updateNotes = useUpdateNotes();
  const { isConnecting } = useBackendConnectionSingleton();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateNotes.mutateAsync({ stableId: entry.stableId, notes });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        style={{
          backgroundColor: "#0a0a0a",
          border: "1px solid #d4a017",
          color: "#d4a017",
        }}
      >
        <DialogHeader>
          <DialogTitle
            className="font-serif text-lg"
            style={{ color: "#d4a017" }}
          >
            Edit Notes
          </DialogTitle>
          <p className="text-xs font-serif" style={{ color: "#8a6a10" }}>
            {entry.title}
          </p>
        </DialogHeader>

        {isConnecting && (
          <div
            className="flex items-center gap-2 px-3 py-2 text-xs"
            style={{ border: "1px solid #8a6a10", color: "#8a6a10" }}
          >
            <Loader2 size={12} className="animate-spin" />
            Connecting to backend...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={6}
            placeholder="Add your notes here..."
            className="w-full px-3 py-2 text-sm outline-none resize-none"
            style={{
              backgroundColor: "#f5f0e8",
              border: "1px solid #d4a017",
              color: "#1a1a2e",
              borderRadius: "2px",
            }}
          />

          {updateNotes.isError && (
            <p className="text-sm" style={{ color: "#cc4444" }}>
              {updateNotes.error instanceof Error
                ? updateNotes.error.message
                : "Failed to save notes."}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-3 py-1.5 text-xs border font-serif transition-all"
              style={{
                borderColor: "#8a6a10",
                color: "#8a6a10",
                backgroundColor: "transparent",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateNotes.isPending || isConnecting}
              className="px-3 py-1.5 text-xs border font-serif transition-all disabled:opacity-50 flex items-center gap-1"
              style={{
                borderColor: "#d4a017",
                color: "#d4a017",
                backgroundColor: "transparent",
              }}
            >
              {updateNotes.isPending ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={12} />
                  Save Notes
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
