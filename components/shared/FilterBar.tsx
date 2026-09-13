import React from "react";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";

export interface FilterSelectOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  search?: {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
  };
  selects?: {
    id: string;
    label?: string;
    value: string;
    onChange: (val: string) => void;
    options: FilterSelectOption[];
  }[];
  dateRange?: {
    startDate: string;
    endDate: string;
    onStartChange: (val: string) => void;
    onEndChange: (val: string) => void;
  };
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
  className?: string;
}

export function FilterBar({
  search,
  selects,
  dateRange,
  onClearFilters,
  hasActiveFilters,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        "glow-panel rounded-2xl p-3.5 flex flex-wrap items-center gap-3 text-xs shadow-md",
        className
      )}
    >
      {/* Search Input */}
      {search && (
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-[#8b8fa3] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            placeholder={search.placeholder || "Search records..."}
            className="w-full pl-9 pr-3 py-2 bg-[#1e2028] border border-[#2a2d38] rounded-xl text-[#E9ECEF] placeholder:text-[#8b8fa3] focus:outline-none focus:border-[#FB5607] focus:ring-1 focus:ring-[#FB5607] transition-colors"
          />
          {search.value && (
            <button
              onClick={() => search.onChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8b8fa3] hover:text-[#E9ECEF]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Select Dropdowns */}
      {selects &&
        selects.map((sel) => (
          <div key={sel.id} className="flex items-center gap-1.5 min-w-[130px]">
            {sel.label && (
              <span className="text-[#8b8fa3] font-medium whitespace-nowrap">
                {sel.label}:
              </span>
            )}
            <select
              value={sel.value}
              onChange={(e) => sel.onChange(e.target.value)}
              className="w-full px-2.5 py-2 bg-[#1e2028] border border-[#2a2d38] rounded-xl text-[#E9ECEF] font-medium focus:outline-none focus:border-[#FB5607] transition-colors cursor-pointer"
            >
              {sel.options.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#1a1c23] text-[#E9ECEF]">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

      {/* Date Range */}
      {dateRange && (
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => dateRange.onStartChange(e.target.value)}
            className="px-2.5 py-1.5 bg-[#1e2028] border border-[#2a2d38] rounded-xl text-[#E9ECEF] focus:outline-none focus:border-[#FB5607]"
          />
          <span className="text-[#8b8fa3]">to</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => dateRange.onEndChange(e.target.value)}
            className="px-2.5 py-1.5 bg-[#1e2028] border border-[#2a2d38] rounded-xl text-[#E9ECEF] focus:outline-none focus:border-[#FB5607]"
          />
        </div>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && onClearFilters && (
        <button
          onClick={onClearFilters}
          className="inline-flex items-center gap-1 px-3 py-2 border border-[#2a2d38] rounded-xl bg-[#21232c] text-[#8b8fa3] hover:text-[#E9ECEF] hover:bg-[#282b36] transition-colors font-medium"
        >
          <X className="w-3.5 h-3.5" />
          Clear
        </button>
      )}
    </div>
  );
}
