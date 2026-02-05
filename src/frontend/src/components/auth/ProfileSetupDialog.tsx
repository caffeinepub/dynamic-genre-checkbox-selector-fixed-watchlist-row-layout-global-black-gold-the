import { useState } from 'react';
import { useSaveCallerUserProfile } from '../../hooks/useCurrentUserProfile';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';

interface ProfileSetupDialogProps {
  open: boolean;
}

export function ProfileSetupDialog({ open }: ProfileSetupDialogProps) {
  const [name, setName] = useState('');
  const saveProfile = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      await saveProfile.mutateAsync({ name: name.trim() });
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Welcome to MangaList</DialogTitle>
            <DialogDescription>
              Please enter your name to get started with your personal manga watchlist.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="mt-2"
              autoFocus
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!name.trim() || saveProfile.isPending}>
              {saveProfile.isPending ? 'Saving...' : 'Continue'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
