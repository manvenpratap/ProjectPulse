import React from 'react';
import { ChevronRight } from 'lucide-react';
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
  cell: (item: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  onClick?: (item: T, event: React.MouseEvent) => void;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyField?: keyof T | ((item: T) => string);
  density?: DensityMode;
  showInlineFilters?: boolean;

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
  pagination,
  itemLabel,
  pageSizeOptions
}: DataTableProps<T>): React.ReactElement {
  // Determine if expand slot should be shown
  const hasExpand = expandable ?? (Boolean(canExpand) || Boolean(renderSubRows));
  const hasInlineFilters = showInlineFilters && columns.some(c => c.filter !== undefined && c.filter !== null);
  
  // Calculate row number offset (derive from pagination if available)
  const baseStartIndex = pagination ? pagination.startIndex : (externalStartIndex ?? 0);

  // Compute items to display (paginatedItems if pagination provided, else data)
  const itemsToRender = pagination ? pagination.paginatedItems : data;

  // Calculate total columns for empty state colSpan
  const totalCols = (selectable ? 1 : 0) + (showRowNumbers ? 1 : 0) + (hasExpand ? 1 : 0) + columns.length;

  const padY = density === 'compact' ? 'py-1.5' : 'py-2';

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
    <div className={clsx("rounded-2xl border border-[var(--color-divider)] bg-[var(--color-surface)] shadow-xs overflow-hidden", containerClassName)}>
      <div className={clsx("overflow-auto custom-scroll relative", maxHeight)}>
        <table className={clsx("w-full text-left border-collapse", minWidth, tableClassName)}>
          <thead className="sticky top-0 z-10 bg-[var(--color-surface-offset)] shadow-[0_1px_0_0_var(--color-divider)]">
            {/* Primary Column Header Row */}
            <tr className="bg-[var(--color-surface-offset)] border-b border-[var(--color-divider)] text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)] select-none">
              {/* Checkbox Header */}
              {selectable && (
                <th className="px-2.5 py-2 w-10 text-center">
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
                <th className="px-2 py-2 w-11 text-center td-rn font-mono text-[10px]" title="Sequential row index">
                  #
                </th>
              )}

              {/* Expand Toggle Header */}
              {hasExpand && (
                <th className="px-1 py-2 w-8 text-center" title="Expand or collapse rows" />
              )}

              {/* Data Columns */}
              {columns.map((col) => {
                const isSorted = sortField && sortField === (col.sortKey || col.id);
                const alignClass = 
                  col.align === 'center' ? 'px-2 text-center' :
                  col.align === 'right' ? 'px-3 text-right' :
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
                      "py-2 whitespace-nowrap transition-colors select-none",
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
                {columns.map((col) => {
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
                    onClick={onRowClick ? (e) => onRowClick(item, e) : undefined}
                    className={clsx(
                      "group hover:bg-[var(--color-surface-2)]/70 transition-colors relative",
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
                      <td className={clsx("px-2 text-center td-rn font-mono text-[10px] text-[var(--color-text-faint)]", padY)}>
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
                    {columns.map((col) => {
                      const alignClass = 
                        col.align === 'center' ? 'px-2 text-center' :
                        col.align === 'right' ? 'px-3 text-right' :
                        'px-3 text-left';

                      return (
                        <td
                          key={col.id}
                          className={clsx(padY, alignClass, col.className)}
                          onClick={col.onClick ? (e) => { e.stopPropagation(); col.onClick!(item, e); } : undefined}
                        >
                          {col.cell(item, idx)}
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

