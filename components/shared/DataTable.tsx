import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { EmptyState } from "./EmptyState";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { ErrorState } from "./ErrorState";

export interface Column<T> {
  key: string;
  header: string;
  accessor?: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  isNumeric?: boolean;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  loading = false,
  error = null,
  onRetry,
  emptyTitle,
  emptyDescription,
  onRowClick,
  pageSize = 10,
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      const res = valA < valB ? -1 : 1;
      return sortOrder === "asc" ? res : -res;
    });
  }, [data, sortKey, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (columnKey: string) => {
    if (sortKey === columnKey) {
      if (sortOrder === "asc") setSortOrder("desc");
      else {
        setSortKey(null);
        setSortOrder("asc");
      }
    } else {
      setSortKey(columnKey);
      setSortOrder("asc");
    }
  };

  if (loading) {
    return <LoadingSkeleton variant="table" rows={pageSize} className={className} />;
  }

  if (error) {
    return <ErrorState title="Error Loading Table" message={error} onRetry={onRetry} className={className} />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle || "No records"}
        description={emptyDescription || "There are no entries available to show in this view."}
        className={className}
      />
    );
  }

  return (
    <div className={cn("glow-panel rounded-2xl overflow-hidden flex flex-col shadow-lg", className)}>
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs text-[#E9ECEF]">
          {/* Sticky Header */}
          <thead className="sticky top-0 bg-[#16181f] border-b border-[#2a2d38] text-[#8b8fa3] font-bold uppercase tracking-wider z-10">
            <tr>
              {columns.map((col) => {
                const alignClass =
                  col.align === "right" || col.isNumeric
                    ? "text-right"
                    : col.align === "center"
                    ? "text-center"
                    : "text-left";
                return (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    onClick={() => col.sortable && handleSort(col.key)}
                    className={cn(
                      "px-4 py-3 select-none text-[11px]",
                      alignClass,
                      col.sortable && "cursor-pointer hover:text-[#E9ECEF] transition-colors"
                    )}
                  >
                    <div
                      className={cn(
                        "inline-flex items-center gap-1",
                        (col.align === "right" || col.isNumeric) && "flex-row-reverse"
                      )}
                    >
                      <span>{col.header}</span>
                      {col.sortable && sortKey === col.key && (
                        <span className="text-[#FB5607]">
                          {sortOrder === "asc" ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          {/* Clean Dark Row Dividers */}
          <tbody className="divide-y divide-[#2a2d38]/80">
            {paginatedData.map((row, idx) => {
              const key = keyExtractor(row, idx);
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={cn(
                    "hover:bg-[#21232c] transition-colors text-[#E9ECEF]",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {columns.map((col) => {
                    const alignClass =
                      col.align === "right" || col.isNumeric
                        ? "text-right"
                        : col.align === "center"
                        ? "text-center"
                        : "text-left";
                    const isTabular = col.isNumeric || col.align === "right";

                    return (
                      <td
                        key={col.key}
                        className={cn(
                          "px-4 py-3.5 whitespace-nowrap",
                          alignClass,
                          isTabular && "tabular-nums"
                        )}
                      >
                        {col.accessor ? col.accessor(row) : row[col.key]}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="px-4 py-3 bg-[#16181f] border-t border-[#2a2d38] flex items-center justify-between text-xs text-[#8b8fa3]">
          <div>
            Showing{" "}
            <span className="font-semibold text-[#E9ECEF]">
              {(currentPage - 1) * pageSize + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-[#E9ECEF]">
              {Math.min(currentPage * pageSize, sortedData.length)}
            </span>{" "}
            of <span className="font-semibold text-[#E9ECEF]">{sortedData.length}</span> entries
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-[#2a2d38] bg-[#1a1c23] disabled:opacity-30 hover:bg-[#21232c] text-[#E9ECEF] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-[#E9ECEF]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-[#2a2d38] bg-[#1a1c23] disabled:opacity-30 hover:bg-[#21232c] text-[#E9ECEF] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
