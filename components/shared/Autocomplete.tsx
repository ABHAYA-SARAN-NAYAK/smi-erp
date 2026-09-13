import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Search, Plus, Check, ChevronDown, X } from "lucide-react";

export interface AutocompleteOption {
  value: string;
  label: string;
  sublabel?: string;
  meta?: any;
}

interface AutocompleteProps {
  options: AutocompleteOption[];
  value: string;
  onChange: (value: string, option?: AutocompleteOption) => void;
  placeholder?: string;
  addNewLabel?: string;
  onAddNew?: (query: string) => void;
  className?: string;
  disabled?: boolean;
}

export function Autocomplete({
  options,
  value,
  onChange,
  placeholder = "Select or type to search...",
  addNewLabel = "Add new",
  onAddNew,
  className,
  disabled = false,
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Sync display query when value changes externally
  useEffect(() => {
    if (selectedOption) {
      setQuery(selectedOption.label);
    } else if (!value) {
      setQuery("");
    }
  }, [value, selectedOption]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Reset query to selected label if closed without selecting
        if (selectedOption) {
          setQuery(selectedOption.label);
        } else if (!value) {
          setQuery("");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedOption, value]);

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(query.toLowerCase()) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(query.toLowerCase()))
  );

  const handleSelect = (opt: AutocompleteOption) => {
    onChange(opt.value, opt);
    setQuery(opt.label);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
  };

  return (
    <div ref={containerRef} className={cn("relative w-full text-xs", className)}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between px-3 py-2 bg-slate-bg/50 border border-line rounded-lg cursor-pointer transition-colors",
          isOpen && "border-amber ring-1 ring-amber bg-panel-bg",
          disabled && "opacity-50 cursor-not-allowed bg-slate-bg"
        )}
      >
        <div className="flex items-center gap-2 flex-1 overflow-hidden pr-2">
          <Search className="w-3.5 h-3.5 text-ink-soft shrink-0" />
          <input
            type="text"
            value={query}
            disabled={disabled}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="w-full bg-transparent text-ink placeholder:text-ink-soft focus:outline-none text-xs font-medium"
          />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="text-ink-soft hover:text-ink p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={cn("w-3.5 h-3.5 text-ink-soft transition-transform", isOpen && "rotate-180")} />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-panel-bg border border-line rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto divide-y divide-line">
          {filteredOptions.length > 0 ? (
            <div className="py-1">
              {filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-slate-bg transition-colors",
                      isSelected && "bg-amber-soft/50 font-semibold"
                    )}
                  >
                    <div>
                      <div className="text-ink font-medium">{opt.label}</div>
                      {opt.sublabel && (
                        <div className="text-[11px] text-ink-soft">{opt.sublabel}</div>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-amber shrink-0 ml-2" />}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-3 py-2 text-ink-soft text-center italic">
              No matching options
            </div>
          )}

          {/* Inline + Add New trigger */}
          {onAddNew && (
            <button
              type="button"
              onClick={() => {
                onAddNew(query);
                setIsOpen(false);
              }}
              className="w-full px-3 py-2.5 bg-slate-bg/50 hover:bg-amber-soft text-amber font-semibold flex items-center justify-center gap-1.5 transition-colors text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              {addNewLabel} {query ? `"${query}"` : ""}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
