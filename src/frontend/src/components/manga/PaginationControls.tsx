import { useState, FormEvent } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export function PaginationControls({ currentPage, totalPages, onPageChange, disabled = false }: PaginationControlsProps) {
  const [pageInput, setPageInput] = useState('');

  // Helper to clamp page numbers to valid range
  const clampPage = (page: number): number => {
    return Math.max(1, Math.min(page, totalPages));
  };

  const handlePageClick = (page: number) => {
    if (disabled) return;
    const clampedPage = clampPage(page);
    onPageChange(clampedPage);
  };

  const handlePreviousClick = () => {
    if (disabled || currentPage === 1) return;
    const clampedPage = clampPage(currentPage - 1);
    onPageChange(clampedPage);
  };

  const handleNextClick = () => {
    if (disabled || currentPage === totalPages) return;
    const clampedPage = clampPage(currentPage + 1);
    onPageChange(clampedPage);
  };

  const handlePageJump = (e: FormEvent) => {
    e.preventDefault();
    if (disabled) return;

    const targetPage = parseInt(pageInput, 10);
    if (!isNaN(targetPage)) {
      const clampedPage = clampPage(targetPage);
      onPageChange(clampedPage);
      setPageInput('');
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex flex-col items-center gap-4 mt-8">
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePreviousClick}
          disabled={currentPage === 1 || disabled}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {getPageNumbers().map((page, index) => (
          typeof page === 'number' ? (
            <Button
              key={index}
              variant={currentPage === page ? 'default' : 'outline'}
              onClick={() => handlePageClick(page)}
              disabled={disabled}
              className="min-w-[2.5rem]"
            >
              {page}
            </Button>
          ) : (
            <span key={index} className="px-2 text-muted-foreground">
              {page}
            </span>
          )
        ))}

        <Button
          variant="outline"
          size="icon"
          onClick={handleNextClick}
          disabled={currentPage === totalPages || disabled}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {totalPages > 1 && (
        <form onSubmit={handlePageJump} className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Go to page:</span>
          <Input
            type="number"
            min={1}
            max={totalPages}
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            disabled={disabled}
            placeholder={`1-${totalPages}`}
            className="w-24 h-9"
          />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={disabled || !pageInput}
          >
            Go
          </Button>
        </form>
      )}
    </div>
  );
}
