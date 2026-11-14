import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronRight, LayoutList, Table2, SlidersHorizontal, RotateCcw } from 'lucide-react';
import clsx from 'clsx';
import TablePagination, { UsePaginationReturn } from './TablePagination';

export type DensityMode = 'comfortable' | 'compact';

export interface ColumnDef<T> {
  id: string;
  header: React.ReactNode;
  headerTitle?: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  sortKey?: string;
  filter?: React.ReactNode;
  cell: (item: T, index: number, meta?: { density: DensityMode }) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  onClick?: (item: T, event: React.MouseEvent) => void;
  hideable?: boolean;
  defaultHidden?: boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyField?: keyof T | ((item: T) => string);
  density?: DensityMode;
  showInlineFilters?: boolean;
  enableColumnVisibility?: boolean;
  columnVisibilityStorageKey?: string;

  // Viewport bounds & scroll
  maxHeight?: string;
  minWidth?: string;
  containerClassName?: string;
  tableClassName?: string;

  // Sorting
  sortField?: string;
  sortAsc?: boolean;
  onSort?: (field: string) => void;

  // Row Selection & Checkbox Column
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string, event: React.ChangeEvent<HTMLInputElement> | React.MouseEvent) => void;
  onToggleSelectAll?: () => void;
  isAllSelected?: boolean;

  // Row Numbering (#)
  showRowNumbers?: boolean;
  startIndex?: number;

  // Tree / Sub-rows Expansion
  expandable?: boolean;
  canExpand?: (item: T) => boolean;
  isExpanded?: (item: T) => boolean;
  onToggleExpand?: (item: T, event: React.MouseEvent) => void;
  renderSubRows?: (item: T, index: number) => React.ReactNode;

  // Customization
  onRowClick?: (item: T, event: React.MouseEvent) => void;
  rowClassName?: (item: T, index: number) => string | undefined | false;

  // Empty State
  emptyMessage?: React.ReactNode;

  // Responsive Accessibility & Mobile Card Mode (< md)
  tableLabel?: string;
  mobileCardRenderer?: (
    item: T,
    meta: {
      isSelected: boolean;
      onToggleSelect: (event: React.ChangeEvent<HTMLInputElement> | React.MouseEvent) => void;
      index: number;
    }
  ) => React.ReactNode;

  // Optional Integrated Pagination
  pagination?: UsePaginationReturn<T>;
  itemLabel?: string;
  pageSizeOptions?: number[];
}

export function DataTable<T>({
  data,
  columns,
  keyField,
  density = 'comfortable',
  showInlineFilters = true,
  maxHeight = 'max-h-[calc(100vh-280px)]',
  minWidth = 'min-w-[1100px]',
  containerClassName,
  tableClassName,
  sortField,
  sortAsc = true,
  onSort,
  selectable = false,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  isAllSelected = false,
  showRowNumbers = true,
  startIndex: externalStartIndex,
  expandable,
  canExpand,
  isExpanded,
  onToggleExpand,
  renderSubRows,
  onRowClick,
  rowClassName,
  emptyMessage,
  tableLabel,
  mobileCardRenderer,
  pagination,
  itemLabel,
  pageSizeOptions,
  enableColumnVisibility = true,
  columnVisibilityStorageKey
}: DataTableProps<T>): React.ReactElement {
  const [showMatrixOnMobile, setShowMatrixOnMobile] = useState(false);

  // Column Visibility State & Persistence
  const storageKey = columnVisibilityStorageKey || (tableLabel ? `pp_cols_${tableLabel.replace(/\s+/g, '_').toLowerCase()}` : undefined);
  const [hiddenColumnIds, setHiddenColumnIds] = useState<Set<string>>(() => {
    if (storageKey && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) return new Set(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
    const defHidden = columns.filter(c => c.defaultHidden).map(c => c.id);
    return new Set(defHidden);
  });

  const [isColMenuOpen, setIsColMenuOpen] = useState(false);
  const colMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isColMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node)) {
        setIsColMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isColMenuOpen]);

  const toggleColumnVisibility = (colId: string) => {
    setHiddenColumnIds(prev => {
      const next = new Set(prev);
      if (next.has(colId)) next.delete(colId);
      else next.add(colId);

      if (storageKey && typeof window !== 'undefined') {
        try {
          localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
        } catch (e) {
          // ignore
        }
      }
      return next;
    });
  };

  const showAllColumns = () => {
    setHiddenColumnIds(new Set());
    if (storageKey && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey);
      } catch (e) {
        // ignore
      }
    }
  };

  // Filter columns based on visibility
  const visibleColumns = useMemo(() => {
    if (!enableColumnVisibility) return columns;
    return columns.filter(c => !hiddenColumnIds.has(c.id));
  }, [columns, hiddenColumnIds, enableColumnVisibility]);

  // Determine if expand slot should be shown
  const hasExpand = expandable ?? (Boolean(canExpand) || Boolean(renderSubRows));
  const hasInlineFilters = showInlineFilters && visibleColumns.some(c => c.filter !== undefined && c.filter !== null);
  
  // Calculate row number offset (derive from pagination if available)
  const baseStartIndex = pagination ? pagination.startIndex : (externalStartIndex ?? 0);

  // Compute items to display (paginatedItems if pagination provided, else data)
  const itemsToRender = pagination ? pagination.paginatedItems : data;

  // Calculate total columns for empty state colSpan
  const totalCols = (selectable ? 1 : 0) + (showRowNumbers ? 1 : 0) + (hasExpand ? 1 : 0) + visibleColumns.length;

  const isCompact = density === 'compact';
  const padY = isCompact ? 'py-1' : 'py-2.5 sm:py-3';
  const headPadY = isCompact ? 'py-1.5' : 'py-2.5';

  const getKey = (item: T, index: number): string => {
    if (typeof keyField === 'function') {
      return keyField(item);
    }
    if (keyField && item && (item as any)[keyField] !== undefined) {
      return String((item as any)[keyField]);
    }
    if (item && typeof item === 'object') {
      if ('id' in item && (item as any).id !== undefined) return String((item as any).id);
      if ('key' in item && (item as any).key !== undefined) return String((item as any).key);
      if ('code' in item && (item as any).code !== undefined) return String((item as any).code);
    }
    return String(index);
  };

  return (
    <div 
      className={clsx(
        "rounded-2xl border border-[var(--color-divider)] bg-[var(--color-surface)] shadow-xs overflow-hidden",
        isCompact ? "density-compact" : "density-comfortable",
        containerClassName
      )}
      data-density={density}
    >
      {/* Table Utility Bar (Column Visibility & Presentation Modes) */}
      {(mobileCardRenderer || enableColumnVisibility) && (
        <div className="px-3 py-2 border-b border-[var(--color-divider)] bg-[var(--color-surface-2)]/60 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] font-semibold">
            {selectable && (
              <label className="inline-flex items-center gap-1.5 cursor-pointer min-h-[28px]">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onToggleSelectAll}
                  aria-label="Select all rows"
                  className="rounded border-[var(--color-divider)] text-[var(--color-primary-hex)] cursor-pointer"
                />
                <span className="hidden sm:inline">Select all</span>
              </label>
            )}
            <span className="font-mono text-[11px] text-[var(--color-text-faint)]">
              {tableLabel ? <span className="font-semibold text-[var(--color-text-muted)] mr-1.5">{tableLabel} •</span> : null}
              {itemsToRender.length} {itemLabel || 'records'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Column Visibility Popover Trigger */}
            {enableColumnVisibility && (
              <div className="relative" ref={colMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsColMenuOpen(!isColMenuOpen)}
                  className={clsx(
                    "px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border transition-all cursor-pointer",
                    isColMenuOpen
                      ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)] border-[var(--color-primary-hex)]/40 shadow-xs"
                      : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-divider)] hover:text-[var(--color-text)]"
                  )}
                  title="Toggle visible columns"
                  aria-expanded={isColMenuOpen}
                >
                  <SlidersHorizontal size={12} />
                  <span>Columns</span>
                  <span className="px-1 py-0.2 rounded-full text-[9px] font-mono bg-[var(--color-surface-2)] text-[var(--color-text-faint)]">
                    {visibleColumns.length}/{columns.length}
                  </span>
                </button>

                {/* Popover Dropdown */}
                {isColMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 z-40 w-60 p-2 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-divider)] shadow-xl space-y-1.5 text-xs animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-2 py-1 flex items-center justify-between border-b border-[var(--color-divider)] text-[11px] font-bold text-[var(--color-text-muted)]">
                      <span>Column Visibility</span>
                      <button
                        type="button"
                        onClick={showAllColumns}
                        className="text-[10px] text-[var(--color-primary-hex)] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                      >
                        <RotateCcw size={10} />
                        <span>Show All</span>
                      </button>
                    </div>

                    <div className="max-h-56 overflow-y-auto custom-scroll space-y-0.5 p-0.5">
                      {columns.map(col => {
                        const isVisible = !hiddenColumnIds.has(col.id);
                        const isLocked = col.hideable === false;
                        const label = col.headerTitle || (typeof col.header === 'string' ? col.header : col.id);

                        return (
                          <label
                            key={col.id}
                            className={clsx(
                              "flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors select-none",
                              isLocked ? "opacity-60 cursor-not-allowed" : "hover:bg-[var(--color-surface-2)] cursor-pointer"
                            )}
                          >
                            <span className="truncate pr-2 font-medium text-[var(--color-text)]">{label}</span>
                            <input
                              type="checkbox"
                              checked={isVisible}
                              disabled={isLocked}
                              onChange={() => toggleColumnVisibility(col.id)}
                              className="rounded border-[var(--color-divider)] text-[var(--color-primary-hex)] cursor-pointer"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Cards vs Matrix Presentation Switcher */}
            {mobileCardRenderer && (
              <div className="md:hidden inline-flex items-center p-0.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-divider)]">
                <button
                  type="button"
                  onClick={() => setShowMatrixOnMobile(false)}
                  className={clsx(
                    "px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer",
                    !showMatrixOnMobile ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)]" : "text-[var(--color-text-muted)]"
                  )}
                >
                  <LayoutList size={12} aria-hidden="true" />
                  <span>Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowMatrixOnMobile(true)}
                  className={clsx(
                    "px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer",
                    showMatrixOnMobile ? "bg-[var(--color-primary-highlight-hex)] text-[var(--color-primary-hex)]" : "text-[var(--color-text-muted)]"
                  )}
                >
                  <Table2 size={12} aria-hidden="true" />
                  <span>Matrix</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Native Touch Cards (< md) */}
      {mobileCardRenderer && !showMatrixOnMobile && (
        <div className="md:hidden divide-y divide-[var(--color-divider)]/60">
          {itemsToRender.map((item, idx) => {
            const id = getKey(item, idx);
            const isSelected = selectedIds ? selectedIds.has(id) : false;
            return (
              <React.Fragment key={id}>
                {mobileCardRenderer(item, {
                  isSelected,
                  onToggleSelect: (e) => onToggleSelect && onToggleSelect(id, e),
                  index: idx,
                })}
              </React.Fragment>
            );
          })}
          {itemsToRender.length === 0 && (
            <div className="py-10 px-4 text-center">
              {emptyMessage ?? (
                <div className="text-sm font-semibold text-[var(--color-text-muted)]">
                  No records to display
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div
        role="region"
        aria-label={tableLabel || 'Data table'}
        tabIndex={0}
        className={clsx(
          "overflow-auto custom-scroll relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-hex)]",
          maxHeight,
          mobileCardRenderer && !showMatrixOnMobile && "hidden md:block"
        )}
      >
        <table 
          data-density={density}
          className={clsx(
            "w-full text-left border-collapse", 
            isCompact ? "density-compact" : "density-comfortable", 
            minWidth, 
            tableClassName
          )}
        >
          <thead className="sticky top-0 z-10 bg-[var(--color-surface)]/90 backdrop-blur-md shadow-[0_1px_0_0_var(--color-divider)]">
            {/* Primary Column Header Row */}
            <tr className={clsx("bg-transparent border-b border-[var(--color-divider)] text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)] select-none", headPadY)}>
              {/* Checkbox Header */}
              {selectable && (
                <th className={clsx("px-2.5 w-10 text-center", headPadY)}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={onToggleSelectAll}
                    aria-label="Select all rows"
                    className="rounded border-[var(--color-divider)] text-[var(--color-primary-hex)] cursor-pointer"
                  />
                </th>
              )}

              {/* Row Number Header (#) */}
              {showRowNumbers && (
                <th className={clsx("px-2 w-11 text-center td-rn font-mono text-[10px] tabular-nums", headPadY)} title="Sequential row index">
                  #
                </th>
              )}

              {/* Expand Toggle Header */}
              {hasExpand && (
                <th className={clsx("px-1 w-8 text-center", headPadY)} title="Expand or collapse rows" />
              )}

              {/* Data Columns */}
              {visibleColumns.map((col) => {
                const isSorted = sortField && sortField === (col.sortKey || col.id);
                const alignClass = 
                  col.align === 'center' ? 'px-2 text-center' :
                  col.align === 'right' ? 'px-3 text-right tabular-nums' :
                  'px-3 text-left';

                const justifyClass =
                  col.align === 'center' ? 'justify-center' :
                  col.align === 'right' ? 'justify-end' :
                  'justify-between';

                return (
                  <th
                    key={col.id}
                    onClick={col.sortable && onSort ? () => onSort(col.sortKey || col.id) : undefined}
                    className={clsx(
                      headPadY,
                      "whitespace-nowrap transition-colors select-none",
                      alignClass,
                      col.width,
                      col.sortable && onSort && "cursor-pointer hover:bg-[var(--color-surface-2)]",
                      col.headerClassName
                    )}
                    title={col.headerTitle}
                  >
                    <div className={clsx("flex items-center gap-1", justifyClass)}>
                      <span>{col.header}</span>
                      {col.sortable && onSort && (
                        <span className={clsx("text-[9px]", isSorted ? "text-[var(--color-primary-hex)] font-bold" : "opacity-35")}>
                          {isSorted ? (sortAsc ? '↑' : '↓') : '↕'}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>

            {/* Inline Filter Row (Sticky along with header) */}
            {hasInlineFilters && (
              <tr className="bg-[var(--color-surface-2)] border-b border-[var(--color-divider)] text-xs shadow-xs">
                {selectable && <th className="p-1" />}
                {showRowNumbers && <th className="p-1" />}
                {hasExpand && <th className="p-1" />}
                {visibleColumns.map((col) => {
                  const alignClass = 
                    col.align === 'center' ? 'text-center' :
                    col.align === 'right' ? 'text-right' :
                    'text-left';

                  return (
                    <th key={`filter-${col.id}`} className={clsx("p-1", alignClass, col.headerClassName)}>
                      {col.filter ?? null}
                    </th>
                  );
                })}
              </tr>
            )}
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[var(--color-divider)]/40">
            {itemsToRender.map((item, idx) => {
              const id = getKey(item, idx);
              const isSelected = selectedIds ? selectedIds.has(id) : false;
              const canItemExpand = canExpand ? canExpand(item) : false;
              const isItemExpanded = isExpanded ? isExpanded(item) : false;
              const customRowClass = rowClassName ? rowClassName(item, idx) : '';

              return (
                <React.Fragment key={id}>
                  <tr
                    data-density={density}
                    onClick={onRowClick ? (e) => onRowClick(item, e) : undefined}
                    className={clsx(
                      "group hover:bg-[var(--color-surface-2)]/70 transition-colors duration-75 relative",
                      onRowClick && "cursor-pointer",
                      isSelected && "bg-[var(--color-primary-highlight-hex)]/35",
                      customRowClass
                    )}
                  >
                    {/* Checkbox Cell */}
                    {selectable && (
                      <td className={clsx("px-2.5 text-center", padY)} onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => onToggleSelect && onToggleSelect(id, e)}
                          aria-label={`Select row ${id}`}
                          className="rounded border-[var(--color-divider)] text-[var(--color-primary-hex)] cursor-pointer"
                        />
                      </td>
                    )}

                    {/* Row Number Cell */}
                    {showRowNumbers && (
                      <td className={clsx("px-2 text-center td-rn font-mono text-[10px] tabular-nums text-[var(--color-text-faint)]", padY)}>
                        {baseStartIndex + idx + 1}
                      </td>
                    )}

                    {/* Expand Button Cell */}
                    {hasExpand && (
                      <td className={clsx("px-1 text-center", padY)} onClick={e => e.stopPropagation()}>
                        {canItemExpand ? (
                          <button
                            onClick={(e) => onToggleExpand && onToggleExpand(item, e)}
                            title={`${isItemExpanded ? 'Collapse' : 'Expand'} details`}
                            className="w-5 h-5 inline-flex items-center justify-center rounded-md hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] cursor-pointer transition-transform"
                          >
                            <ChevronRight
                              size={13}
                              className={clsx("transition-transform duration-150", isItemExpanded && "rotate-90 text-[var(--color-primary-hex)]")}
                            />
                          </button>
                        ) : null}
                      </td>
                    )}

                    {/* Data Cells */}
                    {visibleColumns.map((col) => {
                      const alignClass = 
                        col.align === 'center' ? 'px-2 text-center' :
                        col.align === 'right' ? 'px-3 text-right tabular-nums' :
                        'px-3 text-left';

                      return (
                        <td
                          key={col.id}
                          className={clsx(padY, alignClass, col.className)}
                          onClick={col.onClick ? (e) => { e.stopPropagation(); col.onClick!(item, e); } : undefined}
                        >
                          {col.cell(item, idx, { density })}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Sub-rows / Child Hierarchy (e.g. subtasks) */}
                  {isItemExpanded && renderSubRows && renderSubRows(item, idx)}
                </React.Fragment>
              );
            })}

            {/* Empty State */}
            {itemsToRender.length === 0 && (
              <tr>
                <td colSpan={totalCols} className="py-12 text-center">
                  {emptyMessage ?? (
                    <div className="text-sm font-semibold text-[var(--color-text-muted)]">
                      No records to display
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Optional Integrated Table Pagination */}
      {pagination && (
        <TablePagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          onPageChange={pagination.setCurrentPage}
          onPageSizeChange={pagination.setPageSize}
          pageSizeOptions={pageSizeOptions}
          itemLabel={itemLabel}
        />
      )}
    </div>
  );
}

export default DataTable;

