import { ChevronLeft, ChevronRight } from "lucide-react";
import type React from "react";
import { useState } from "react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
}: PaginationControlsProps) {
  const [jumpValue, setJumpValue] = useState("");

  const clamp = (p: number) => Math.max(1, Math.min(p, totalPages));

  const handleJump = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number.parseInt(jumpValue, 10);
    if (!Number.isNaN(parsed)) {
      onPageChange(clamp(parsed));
    }
    setJumpValue("");
  };

  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: "4px 10px",
    border: `1px solid ${active ? "#d4a017" : "#8a6a10"}`,
    color: active ? "#d4a017" : "#8a6a10",
    backgroundColor: active ? "rgba(212,160,23,0.1)" : "transparent",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: "12px",
    fontFamily: "Cinzel, serif",
    opacity: disabled ? 0.5 : 1,
    transition: "all 0.2s",
  });

  const navBtnStyle: React.CSSProperties = {
    padding: "4px 8px",
    border: "1px solid #8a6a10",
    color: "#8a6a10",
    backgroundColor: "transparent",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "all 0.2s",
  };

  // Generate page numbers to show
  const pages: (number | "ellipsis-before" | "ellipsis-after")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("ellipsis-before");
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("ellipsis-after");
    pages.push(totalPages);
  }

  return (
    <div
      className="flex items-center justify-center gap-2 flex-wrap py-3"
      style={{ borderTop: "1px solid #8a6a10" }}
    >
      {/* Previous */}
      <button
        type="button"
        onClick={() => !disabled && onPageChange(clamp(currentPage - 1))}
        disabled={disabled || currentPage <= 1}
        style={navBtnStyle}
        aria-label="Previous page"
      >
        <ChevronLeft size={14} />
      </button>

      {/* Page Numbers */}
      {pages.map((p) =>
        p === "ellipsis-before" || p === "ellipsis-after" ? (
          <span key={p} style={{ color: "#8a6a10", fontSize: "12px" }}>
            ...
          </span>
        ) : (
          <button
            type="button"
            key={p}
            onClick={() => !disabled && onPageChange(p as number)}
            disabled={disabled}
            style={btnStyle(p === currentPage)}
          >
            {p}
          </button>
        ),
      )}

      {/* Next */}
      <button
        type="button"
        onClick={() => !disabled && onPageChange(clamp(currentPage + 1))}
        disabled={disabled || currentPage >= totalPages}
        style={navBtnStyle}
        aria-label="Next page"
      >
        <ChevronRight size={14} />
      </button>

      {/* Jump to page */}
      <form onSubmit={handleJump} className="flex items-center gap-1 ml-2">
        <input
          type="number"
          value={jumpValue}
          onChange={(e) => setJumpValue(e.target.value)}
          placeholder="Go to..."
          min={1}
          max={totalPages}
          disabled={disabled}
          style={{
            width: "60px",
            padding: "3px 6px",
            backgroundColor: "#0a0a0a",
            border: "1px solid #8a6a10",
            color: "#d4a017",
            fontSize: "12px",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={disabled}
          style={{
            padding: "3px 8px",
            border: "1px solid #8a6a10",
            color: "#8a6a10",
            backgroundColor: "transparent",
            fontSize: "12px",
            cursor: disabled ? "not-allowed" : "pointer",
            fontFamily: "Cinzel, serif",
          }}
        >
          Go
        </button>
      </form>
    </div>
  );
}
