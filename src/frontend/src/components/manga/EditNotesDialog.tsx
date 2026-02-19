import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { useBackendConnectionSingleton } from '../../hooks/useBackendConnectionSingleton';
import { Loader2, AlertCircle } from 'lucide-react';
import { BACKEND_NOT_READY_MESSAGE } from '../../utils/backendNotReadyMessage';

interface EditNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentNotes: string;
  onSave: (notes: string) => Promise<void>;
  isSaving: boolean;
}

export function EditNotesDialog({ open, onOpenChange, currentNotes, onSave, isSaving }: EditNotesDialogProps) {
  const [notes, setNotes] = useState(currentNotes);
  const { isReady } = useBackendConnectionSingleton();

  const handleSave = async () => {
    if (!isReady) {
      console.error(BACKEND_NOT_READY_MESSAGE);
      return;
    }
    await onSave(notes);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setNotes(currentNotes);
    onOpenChange(false);
  };

  const canSave = isReady && !isSaving;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-amber-50 border-2 border-gold max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-gold">Edit Notes</DialogTitle>
        </DialogHeader>
        {!isReady && (
          <div className="flex items-center gap-2 text-sm text-gold bg-muted p-2 rounded">
            <AlertCircle className="h-4 w-4" />
            <span>Backend is connecting. Please wait...</span>
          </div>
        )}
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add your notes here..."
          className="min-h-[200px] bg-white border-gold text-blue-900"
          disabled={isSaving || !isReady}
        />
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isSaving} className="text-gold">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin text-gold" />
                <span className="text-gold">Saving...</span>
              </>
            ) : (
              <span className="text-gold">Save</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
