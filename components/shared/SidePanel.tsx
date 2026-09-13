import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: "sm" | "md" | "lg" | "xl";
}

export function SidePanel({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = "md",
}: SidePanelProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const widthClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }[width];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Slide-in Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className={cn(
            "w-screen bg-[#1a1c23] border-l border-[#2a2d38] shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out text-[#E9ECEF]",
            widthClasses
          )}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#2a2d38] bg-[#16181f] flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#E9ECEF] font-display">{title}</h2>
              {subtitle && <p className="text-xs text-[#8b8fa3] mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8b8fa3] hover:text-[#E9ECEF] hover:bg-[#21232c] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">{children}</div>

          {/* Optional Action Footer */}
          {footer && (
            <div className="px-6 py-4 border-t border-[#2a2d38] bg-[#16181f] flex items-center justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
