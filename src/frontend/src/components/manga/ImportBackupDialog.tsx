import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import type React from "react";
import {
  type ChangeEvent,
  forwardRef,
  useCallback,
  useRef,
  useState,
} from "react";
import { useBackendConnectionSingleton } from "../../hooks/useBackendConnectionSingleton";
import { type BackupChunk, reconstructEntry } from "../../utils/backupUtils";

type Phase = "idle" | "parsed" | "importing" | "done" | "error";

interface ImportBackupDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

// Wrapper for folder input with non-standard webkitdirectory attribute
const FolderInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { webkitdirectory?: string }
>((props, ref) => <input ref={ref} {...props} />);
FolderInput.displayName = "FolderInput";

export default function ImportBackupDialog({
  open,
  onOpenChange,
}: ImportBackupDialogProps) {
  const { actor, isReady } = useBackendConnectionSingleton();
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState<Phase>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [parsedChunk, setParsedChunk] = useState<BackupChunk | null>(null);
  const [folderFiles, setFolderFiles] = useState<FileList | null>(null);

  const jsonInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setPhase("idle");
    setStatusMsg("");
    setErrorMsg("");
    setParsedChunk(null);
    setFolderFiles(null);
    if (jsonInputRef.current) jsonInputRef.current.value = "";
    if (folderInputRef.current) folderInputRef.current.value = "";
  }, []);

  const handleClose = useCallback(() => {
    if (phase !== "importing") {
      resetState();
      onOpenChange(false);
    }
  }, [phase, resetState, onOpenChange]);

  const handleJsonFile = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const data = JSON.parse(text) as BackupChunk;
        if (!data.entries || !Array.isArray(data.entries)) {
          throw new Error("Invalid backup file format.");
        }
        setParsedChunk(data);
        setPhase("parsed");
        setStatusMsg("");
        setErrorMsg("");
      } catch (err: any) {
        setErrorMsg(`Failed to parse backup file: ${err?.message || err}`);
        setPhase("error");
      }
    };
    reader.readAsText(file);
  }, []);

  const handleFolderSelect = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setFolderFiles(e.target.files);
  }, []);

  const buildImageMap = useCallback(
    async (chunk: BackupChunk): Promise<Record<string, string>> => {
      const map: Record<string, string> = { ...chunk.images };
      if (folderFiles) {
        for (let i = 0; i < folderFiles.length; i++) {
          const file = folderFiles[i];
          const filename = file.name;
          await new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
              const data = ev.target?.result as string;
              if (data) map[filename] = data;
              resolve();
            };
            reader.readAsDataURL(file);
          });
        }
      }
      return map;
    },
    [folderFiles],
  );

  const runImport = useCallback(async () => {
    if (!actor || !isReady) {
      setErrorMsg("Backend not ready. Please wait.");
      setPhase("error");
      return;
    }
    if (!parsedChunk) return;

    try {
      setPhase("importing");
      setStatusMsg("Building image map...");
      const imageMap = await buildImageMap(parsedChunk);

      const total = parsedChunk.entries.length;
      for (let i = 0; i < total; i++) {
        setStatusMsg(`Restoring entry ${i + 1} of ${total}...`);
        const entry = reconstructEntry(parsedChunk.entries[i], imageMap);
        await actor.addEntry(entry);
      }

      await queryClient.invalidateQueries({ queryKey: ["allMangaEntries"] });
      setPhase("done");
      setStatusMsg(`Import complete! Restored ${total} entries.`);
    } catch (err: any) {
      setErrorMsg(String(err?.message || err));
      setPhase("error");
    }
  }, [actor, isReady, parsedChunk, buildImageMap, queryClient]);

  const fileInputStyle: React.CSSProperties = {
    color: "#d4a017",
    background: "#0a0a0a",
    border: "1px solid #8a6a10",
    borderRadius: "4px",
    padding: "4px 8px",
    fontSize: "12px",
    width: "100%",
    cursor: "pointer",
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-md"
        style={{
          backgroundColor: "#0a0a0a",
          border: "1px solid #d4a017",
          color: "#d4a017",
        }}
        data-ocid="import_backup.dialog"
      >
        <DialogHeader>
          <DialogTitle style={{ color: "#d4a017", fontFamily: "serif" }}>
            Import Backup
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-4">
          <p className="text-sm" style={{ color: "#b8860b" }}>
            Select a backup JSON file to restore your manga list. Optionally
            select an images folder to restore cover images.
          </p>

          {/* File Inputs */}
          <div className="space-y-3">
            <div>
              <label
                htmlFor="import-json-input"
                className="block text-xs mb-1"
                style={{ color: "#8a6a10" }}
              >
                Backup File (.json)
              </label>
              <input
                id="import-json-input"
                ref={jsonInputRef}
                type="file"
                accept=".json"
                onChange={handleJsonFile}
                disabled={phase === "importing"}
                style={fileInputStyle}
                data-ocid="import_backup.upload_button"
              />
            </div>

            <div>
              <label
                htmlFor="import-folder-input"
                className="block text-xs mb-1"
                style={{ color: "#8a6a10" }}
              >
                Images Folder (optional)
              </label>
              <FolderInput
                id="import-folder-input"
                ref={folderInputRef}
                type="file"
                webkitdirectory=""
                multiple
                onChange={handleFolderSelect}
                disabled={phase === "importing"}
                style={fileInputStyle}
                data-ocid="import_backup.dropzone"
              />
            </div>
          </div>

          {/* Parsed preview */}
          {phase === "parsed" && parsedChunk && (
            <div className="space-y-3">
              <div
                style={{
                  background: "#111",
                  border: "1px solid #8a6a10",
                  borderRadius: "4px",
                  padding: "8px 12px",
                }}
              >
                <p className="text-sm" style={{ color: "#d4a017" }}>
                  Found <strong>{parsedChunk.entries.length}</strong> entries to
                  restore.
                </p>
                {parsedChunk.exportDate && (
                  <p className="text-xs mt-1" style={{ color: "#8a6a10" }}>
                    Exported:{" "}
                    {new Date(parsedChunk.exportDate).toLocaleString()}
                  </p>
                )}
              </div>
              <Button
                onClick={runImport}
                className="w-full"
                style={{
                  background: "none",
                  border: "1px solid #d4a017",
                  color: "#d4a017",
                  cursor: "pointer",
                }}
                data-ocid="import_backup.primary_button"
              >
                Start Import
              </Button>
              <Button
                onClick={resetState}
                className="w-full"
                style={{
                  background: "none",
                  border: "1px solid #8a6a10",
                  color: "#8a6a10",
                  cursor: "pointer",
                }}
                data-ocid="import_backup.cancel_button"
              >
                Clear Selection
              </Button>
            </div>
          )}

          {/* Importing progress */}
          {phase === "importing" && (
            <div
              className="flex flex-col items-center gap-3"
              data-ocid="import_backup.loading_state"
            >
              <div
                className="w-8 h-8 border-2 rounded-full animate-spin"
                style={{
                  borderColor: "#d4a017",
                  borderTopColor: "transparent",
                }}
              />
              <p className="text-sm text-center" style={{ color: "#d4a017" }}>
                {statusMsg}
              </p>
            </div>
          )}

          {/* Done */}
          {phase === "done" && (
            <div
              className="flex flex-col gap-3"
              data-ocid="import_backup.success_state"
            >
              <p className="text-sm text-center" style={{ color: "#a8e6a8" }}>
                ✓ {statusMsg}
              </p>
              <Button
                onClick={handleClose}
                className="w-full"
                style={{
                  background: "none",
                  border: "1px solid #d4a017",
                  color: "#d4a017",
                }}
                data-ocid="import_backup.close_button"
              >
                Close
              </Button>
            </div>
          )}

          {/* Error */}
          {phase === "error" && (
            <div
              className="flex flex-col gap-3"
              data-ocid="import_backup.error_state"
            >
              <p className="text-sm text-center" style={{ color: "#e06060" }}>
                ✗ {errorMsg}
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setPhase("idle");
                    setErrorMsg("");
                  }}
                  className="flex-1"
                  style={{
                    background: "none",
                    border: "1px solid #d4a017",
                    color: "#d4a017",
                  }}
                  data-ocid="import_backup.secondary_button"
                >
                  Try Again
                </Button>
                <Button
                  onClick={handleClose}
                  className="flex-1"
                  style={{
                    background: "none",
                    border: "1px solid #8a6a10",
                    color: "#8a6a10",
                  }}
                  data-ocid="import_backup.cancel_button"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
