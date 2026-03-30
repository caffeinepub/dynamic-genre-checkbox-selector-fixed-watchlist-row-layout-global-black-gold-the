import { ChevronDown, ChevronUp, Download, Upload } from "lucide-react";
import React, { useState } from "react";
import ExportBackupDialog from "./ExportBackupDialog";
import ImportBackupDialog from "./ImportBackupDialog";
import MangaListControls from "./MangaListControls";

type CompletionFilter = "all" | "complete" | "incomplete";

interface FloatingControlsPanelProps {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  selectedGenres: string[];
  onGenresChange: (v: string[]) => void;
  availableGenres: string[];
  sortOption: string;
  onSortChange: (v: string) => void;
  showBookmarkedOnly: boolean;
  onBookmarkToggle: () => void;
  completionFilter: CompletionFilter;
  onCompletionFilterChange: (v: string) => void;
  alignment?: "left" | "center";
  onAlignmentChange?: (v: "left" | "center") => void;
  onAddManga: () => void;
  totalCount?: number;
}

export default function FloatingControlsPanel(
  props: FloatingControlsPanelProps,
) {
  const [collapsed, setCollapsed] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  return (
    <>
      <div
        className="mb-4 sticky top-16 z-40"
        style={{
          backgroundColor: "#000000",
          border: "1px solid #d4a017",
          boxShadow: "0 2px 12px rgba(212,160,23,0.15)",
        }}
      >
        {/* Panel Header */}
        <div
          className="flex items-center justify-between px-3 py-1.5"
          style={{ borderBottom: collapsed ? "none" : "1px solid #8a6a10" }}
        >
          {/* Label button — clicking it toggles collapse */}
          <button
            type="button"
            className="text-xs font-serif cursor-pointer select-none bg-transparent border-none p-0 text-left"
            style={{ color: "#8a6a10" }}
            onClick={() => setCollapsed((p) => !p)}
          >
            Filters & Controls
            {props.totalCount !== undefined && (
              <span style={{ color: "#d4a017" }}>
                {" "}
                · {props.totalCount} entries
              </span>
            )}
          </button>

          {/* Action buttons row */}
          <div className="flex items-center gap-1">
            {/* Export button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExportOpen(true);
              }}
              title="Export backup"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#d4a017",
                padding: "2px 4px",
              }}
              data-ocid="export_backup.open_modal_button"
            >
              <Download size={14} />
            </button>

            {/* Import button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setImportOpen(true);
              }}
              title="Import backup"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#d4a017",
                padding: "2px 4px",
              }}
              data-ocid="import_backup.open_modal_button"
            >
              <Upload size={14} />
            </button>

            {/* Collapse toggle */}
            <button
              type="button"
              className="p-0.5"
              style={{
                color: "#8a6a10",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
              aria-label={collapsed ? "Expand controls" : "Collapse controls"}
              onClick={() => setCollapsed((p) => !p)}
            >
              {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          </div>
        </div>

        {/* Panel Content */}
        {!collapsed && <MangaListControls {...props} />}
      </div>

      <ExportBackupDialog open={exportOpen} onOpenChange={setExportOpen} />
      <ImportBackupDialog open={importOpen} onOpenChange={setImportOpen} />
    </>
  );
}
