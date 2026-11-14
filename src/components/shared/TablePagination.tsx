import { useState, useMemo, useEffect, type FC } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import clsx from 'clsx';

export interface UsePaginationReturn<T> {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  totalPages: number;
  totalItems: number;
  paginatedItems: T[];
  startIndex: number;
}

export function usePagination<T>(
  items: T[], 
  initialPageSize: number = 10, 
  storageKey?: string
): UsePaginationReturn<T> {
  const [pageSize, setPageSizeState] = useState<number>(() => {
    if (storageKey && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved && !isNaN(Number(saved)) && Number(saved) > 0) {
          return Number(saved);
        }
      } catch (e) {
        // ignore
      }
    }
    return initialPageSize;
  });

  const [currentPage, setCurrentPage] = useState<number>(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Auto-clamp page if filtered items count changes
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const setPageSize = (size: number) => {
    setPageSizeState(size);
    if (storageKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, String(size));
      } catch (e) {
        // ignore
      }
    }
    setCurrentPage(1);
  };

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  return {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems: items.length,
    paginatedItems,
    startIndex: (currentPage - 1) * pageSize
  };
}

export interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
  itemLabel?: string;
}

export const TablePagination: FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className,
  itemLabel = 'records'
}) => {
  if (totalItems === 0) return null;

  const startRecord = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endRecord = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with intelligent ellipsis
  const pageNumbers = useMemo(() => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push('ellipsis');
      }
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }
      pages.push(totalPages);
    }
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className={clsx(
      "flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-[var(--color-surface)] border-t border-[var(--color-divider)] text-xs text-[var(--color-text-muted)] select-none",
      className
    )}>
      {/* Left: Summary & Page Size selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-medium text-[var(--color-text)]">
          Showing <span className="font-bold text-[var(--color-text)] font-mono">{startRecord}</span>–<span className="font-bold text-[var(--color-text)] font-mono">{endRecord}</span> of <span className="font-bold text-[var(--color-text)] font-mono">{totalItems}</span> {itemLabel}
        </span>

        <div className="flex items-center gap-1.5 pl-2 sm:border-l border-[var(--color-divider)]">
          <span className="text-[11px] text-[var(--color-text-faint)] font-medium">Rows:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Rows per page"
            className="px-2 py-1 rounded-lg border border-[var(--color-divider)] bg-[var(--color-surface-2)] text-xs font-semibold text-[var(--color-text)] outline-none focus:ring-1 focus:ring-[var(--color-primary-hex)] cursor-pointer"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt} / page
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Page Navigation Buttons */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="First page"
          title="First page"
          className="w-7 h-7 rounded-lg flex items-center justify-center border border-[var(--color-divider)] hover:bg-[var(--color-surface-2)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer text-[var(--color-text)]"
        >
          <ChevronsLeft size={13} />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
          title="Previous page"
          className="w-7 h-7 rounded-lg flex items-center justify-center border border-[var(--color-divider)] hover:bg-[var(--color-surface-2)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer text-[var(--color-text)]"
        >
          <ChevronLeft size={13} />
        </button>

        {/* Numeric Page Buttons */}
        <div className="flex items-center gap-1 px-1">
          {pageNumbers.map((p, idx) => {
            if (p === 'ellipsis') {
              return (
                <span key={`ell-${idx}`} className="px-1 text-[var(--color-text-faint)] font-mono">
                  …
                </span>
              );
            }
            const isActive = p === currentPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={isActive ? 'page' : undefined}
                className={clsx(
                  "min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-semibold font-mono transition-colors cursor-pointer",
                  isActive
                    ? "bg-[var(--color-primary-hex)] text-[var(--color-primary-text)] font-bold shadow-2xs"
                    : "hover:bg-[var(--color-surface-2)] border border-[var(--color-divider)] text-[var(--color-text)]"
                )}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          title="Next page"
          className="w-7 h-7 rounded-lg flex items-center justify-center border border-[var(--color-divider)] hover:bg-[var(--color-surface-2)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer text-[var(--color-text)]"
        >
          <ChevronRight size={13} />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Last page"
          title="Last page"
          className="w-7 h-7 rounded-lg flex items-center justify-center border border-[var(--color-divider)] hover:bg-[var(--color-surface-2)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer text-[var(--color-text)]"
        >
          <ChevronsRight size={13} />
        </button>
      </div>
    </div>
  );
};

export default TablePagination;
