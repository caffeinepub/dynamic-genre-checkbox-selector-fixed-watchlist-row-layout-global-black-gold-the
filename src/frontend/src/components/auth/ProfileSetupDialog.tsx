import { Loader2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useSaveCallerUserProfile } from "../../hooks/useCurrentUserProfile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

export default function ProfileSetupDialog() {
  const [name, setName] = useState("");
  const [open] = useState(true);
  const saveProfile = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await saveProfile.mutateAsync({ name: name.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        style={{
          backgroundColor: "#0a0a0a",
          border: "1px solid #d4a017",
          color: "#d4a017",
        }}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle
            className="font-serif text-xl"
            style={{ color: "#d4a017" }}
          >
            Welcome to Manga Watchlist
          </DialogTitle>
          <DialogDescription style={{ color: "#8a6a10" }}>
            Please enter your display name to get started.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label
              htmlFor="display-name"
              className="block text-sm font-serif mb-1"
              style={{ color: "#d4a017" }}
            >
              Display Name
            </label>
            <input
              id="display-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name..."
              className="w-full px-3 py-2 text-sm outline-none focus:ring-1"
              style={{
                backgroundColor: "#0a0a0a",
                border: "1px solid #d4a017",
                color: "#d4a017",
                borderRadius: "4px",
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 0 6px rgba(212,160,23,0.5)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {saveProfile.isError && (
            <p className="text-sm" style={{ color: "#cc4444" }}>
              {saveProfile.error instanceof Error
                ? saveProfile.error.message
                : "Failed to save profile. Please try again."}
            </p>
          )}

          <button
            type="submit"
            disabled={!name.trim() || saveProfile.isPending}
            className="w-full py-2 font-serif text-sm border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              borderColor: "#d4a017",
              color: "#d4a017",
              backgroundColor: "transparent",
            }}
            onMouseEnter={(e) => {
              if (!saveProfile.isPending && name.trim()) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "rgba(212,160,23,0.15)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "transparent";
            }}
          >
            {saveProfile.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              "Get Started"
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
