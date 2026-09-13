import React from "react";
import { cn } from "@/lib/utils";
import { FolderOpen } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  title = "No data found",
  description = "There are no records to display at this time.",
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-10 text-center bg-panel-bg border border-line rounded-xl",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-slate-bg border border-line flex items-center justify-center text-ink-soft mb-3">
        {icon || <FolderOpen className="w-6 h-6" />}
      </div>
      <h3 className="text-base font-semibold text-ink mb-1">{title}</h3>
      <p className="text-xs text-ink-soft max-w-sm mb-4">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-lg bg-amber text-white hover:bg-amber/90 transition-colors shadow-xs"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
