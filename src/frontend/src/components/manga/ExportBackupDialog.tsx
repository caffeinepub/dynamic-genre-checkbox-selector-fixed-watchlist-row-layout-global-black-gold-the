import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import React, { useState, useCallback } from "react";
import { useBackendConnectionSingleton } from "../../hooks/useBackendConnectionSingleton";
import {
  buildZipChunks,
  fetchImageAsBase64,
  makeBackupId,
  serializeEntry,
} from "../../utils/backupUtils";

type Phase =
  | "idle"
  | "fetching"
  | "images"
  | "generating"
  | "downloading"
  | "done"
  | "error";

interface ExportBackupDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function triggerDownloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ExportBackupDialog({
  open,
  onOpenChange,
}: ExportBackupDialogProps) {
  const { actor, isReady } = useBackendConnectionSingleton();
  const [phase, setPhase] = useState<Phase>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleClose = useCallback(() => {
    if (
      phase !== "fetching" &&
      phase !== "images" &&
      phase !== "generating" &&
      phase !== "downloading"
    ) {
      setPhase("idle");
      setStatusMsg("");
      setErrorMsg("");
      onOpenChange(false);
    }
  }, [phase, onOpenChange]);

  const runExport = useCallback(async () => {
    if (!actor || !isReady) {
      setErrorMsg("Backend not ready. Please wait.");
      setPhase("error");
      return;
    }

    try {
      setPhase("fetching");
      setStatusMsg("Fetching all manga entries...");
      const entries = await actor.getAllEntries();

      setPhase("images");
      const imageMap: Record<string, string> = {};
      let downloaded = 0;

      for (const entry of entries) {
        for (let i = 0; i < entry.coverImages.length; i++) {
          const filename = `manga-${entry.stableId}-cover-${i}.jpg`;
          setStatusMsg(
            `Downloading images (${downloaded + 1}/${entries.length})...`,
          );
          const data = await fetchImageAsBase64(entry.coverImages[i]);
          if (data) imageMap[filename] = data;
        }
        downloaded++;
      }

      setPhase("generating");
      const backupId = makeBackupId();
      const serialized = entries.map(serializeEntry);

      const chunks = await buildZipChunks(
        backupId,
        serialized,
        imageMap,
        (msg) => setStatusMsg(msg),
      );

      setPhase("downloading");
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        setStatusMsg(`Saving file ${i + 1} of ${chunks.length}...`);
        triggerDownloadBlob(chunk.blob, chunk.filename);
        if (i < chunks.length - 1) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }

      setPhase("done");
      setStatusMsg(
        `Export complete! ${chunks.length} ZIP file${
          chunks.length > 1 ? "s" : ""
        } downloaded (${entries.length} entries). Each ZIP contains manifest.json and a covers/ folder.`,
      );
    } catch (err: any) {
      setErrorMsg(String(err?.message || err));
      setPhase("error");
    }
  }, [actor, isReady]);

  const isRunning =
    phase === "fetching" ||
    phase === "images" ||
    phase === "generating" ||
    phase === "downloading";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-md"
        style={{
          backgroundColor: "#0a0a0a",
          border: "1px solid #d4a017",
          color: "#d4a017",
        }}
        data-ocid="export_backup.dialog"
      >
        <DialogHeader>
          <DialogTitle style={{ color: "#d4a017", fontFamily: "serif" }}>
            Export Backup
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-4">
          <p className="text-sm" style={{ color: "#b8860b" }}>
            Exports all manga entries as a ZIP file. Each ZIP contains a{" "}
            <strong style={{ color: "#d4a017" }}>manifest.json</strong>{" "}
            (metadata) and a{" "}
            <strong style={{ color: "#d4a017" }}>covers/</strong> folder with
            all cover images. Large libraries are split into multiple ZIP files
            (max 40 MB each).
          </p>

          {phase === "idle" && (
            <Button
              onClick={runExport}
              className="w-full"
              style={{
                background: "none",
                border: "1px solid #d4a017",
                color: "#d4a017",
                cursor: "pointer",
              }}
              data-ocid="export_backup.primary_button"
            >
              Start Export
            </Button>
          )}

          {isRunning && (
            <div
              className="flex flex-col items-center gap-3"
              data-ocid="export_backup.loading_state"
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

          {phase === "done" && (
            <div
              className="flex flex-col gap-3"
              data-ocid="export_backup.success_state"
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
                data-ocid="export_backup.close_button"
              >
                Close
              </Button>
            </div>
          )}

          {phase === "error" && (
            <div
              className="flex flex-col gap-3"
              data-ocid="export_backup.error_state"
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
                  data-ocid="export_backup.secondary_button"
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
                  data-ocid="export_backup.cancel_button"
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
