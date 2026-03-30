import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import type React from "react";
import { type ChangeEvent, useCallback, useRef, useState } from "react";
import { useBackendConnectionSingleton } from "../../hooks/useBackendConnectionSingleton";
import {
  type BackupManifest,
  parseLegacyJsonBackup,
  parseZipBackup,
  reconstructEntry,
} from "../../utils/backupUtils";

type Phase = "idle" | "parsed" | "importing" | "done" | "error";
type FileFormat = "zip" | "json";

interface ImportBackupDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function ImportBackupDialog({
  open,
  onOpenChange,
}: ImportBackupDialogProps) {
  const { actor, isReady } = useBackendConnectionSingleton();
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState<Phase>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [parsedManifest, setParsedManifest] = useState<BackupManifest | null>(
    null,
  );
  const [parsedImageMap, setParsedImageMap] = useState<Record<string, string>>(
    {},
  );
  const [fileFormat, setFileFormat] = useState<FileFormat>("zip");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setPhase("idle");
    setStatusMsg("");
    setErrorMsg("");
    setParsedManifest(null);
    setParsedImageMap({});
    setFileFormat("zip");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleClose = useCallback(() => {
    if (phase !== "importing") {
      resetState();
      onOpenChange(false);
    }
  }, [phase, resetState, onOpenChange]);

  const handleFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        if (file.name.endsWith(".zip")) {
          setFileFormat("zip");
          const { manifest, imageMap } = await parseZipBackup(file);
          setParsedManifest(manifest);
          setParsedImageMap(imageMap);
          setPhase("parsed");
          setErrorMsg("");
        } else if (file.name.endsWith(".json")) {
          setFileFormat("json");
          const text = await file.text();
          const chunk = parseLegacyJsonBackup(text);
          setParsedManifest(chunk);
          setParsedImageMap(chunk.images || {});
          setPhase("parsed");
          setErrorMsg("");
        } else {
          setErrorMsg("Please select a .zip or .json backup file.");
          setPhase("error");
        }
      } catch (err: any) {
        setErrorMsg(`Failed to parse backup file: ${err?.message || err}`);
        setPhase("error");
      }
    },
    [],
  );

  const runImport = useCallback(async () => {
    if (!actor || !isReady) {
      setErrorMsg("Backend not ready. Please wait.");
      setPhase("error");
      return;
    }
    if (!parsedManifest) return;

    try {
      setPhase("importing");
      const total = parsedManifest.entries.length;
      for (let i = 0; i < total; i++) {
        setStatusMsg(`Restoring entry ${i + 1} of ${total}...`);
        const entry = reconstructEntry(
          parsedManifest.entries[i],
          parsedImageMap,
        );
        await actor.addEntry(entry);
      }

      await queryClient.invalidateQueries({ queryKey: ["allMangaEntries"] });
      setPhase("done");
      setStatusMsg(`Import complete! Restored ${total} entries.`);
    } catch (err: any) {
      setErrorMsg(String(err?.message || err));
      setPhase("error");
    }
  }, [actor, isReady, parsedManifest, parsedImageMap, queryClient]);

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
            Select a backup <strong style={{ color: "#d4a017" }}>.zip</strong>{" "}
            file to restore your manga list. Legacy{" "}
            <strong style={{ color: "#d4a017" }}>.json</strong> backup files are
            also supported.
          </p>

          <div>
            <label
              htmlFor="import-file-input"
              className="block text-xs mb-1"
              style={{ color: "#8a6a10" }}
            >
              Backup File (.zip or .json)
            </label>
            <input
              id="import-file-input"
              ref={fileInputRef}
              type="file"
              accept=".zip,.json"
              onChange={handleFileChange}
              disabled={phase === "importing"}
              style={fileInputStyle}
              data-ocid="import_backup.upload_button"
            />
          </div>

          {/* Parsed preview */}
          {phase === "parsed" && parsedManifest && (
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
                  Found <strong>{parsedManifest.entries.length}</strong> entries
                  to restore.
                </p>
                {Object.keys(parsedImageMap).length > 0 && (
                  <p className="text-xs mt-1" style={{ color: "#8a6a10" }}>
                    {Object.keys(parsedImageMap).length} cover image
                    {Object.keys(parsedImageMap).length !== 1 ? "s" : ""} found
                    {fileFormat === "zip"
                      ? " in covers/ folder"
                      : " (embedded)"}
                    .
                  </p>
                )}
                {parsedManifest.exportDate && (
                  <p className="text-xs mt-1" style={{ color: "#8a6a10" }}>
                    Exported:{" "}
                    {new Date(parsedManifest.exportDate).toLocaleString()}
                  </p>
                )}
                {(parsedManifest.totalChunks ?? 1) > 1 && (
                  <p className="text-xs mt-1" style={{ color: "#c0a020" }}>
                    Chunk {parsedManifest.chunkIndex} of{" "}
                    {parsedManifest.totalChunks} — import all chunks separately.
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
