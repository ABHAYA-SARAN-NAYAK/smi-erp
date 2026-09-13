import React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Failed to load data",
  message = "An unexpected error occurred while fetching information. Please try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center bg-red-50/50 border border-red-200 rounded-xl",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-red-100 border border-red-200 flex items-center justify-center text-danger mb-3">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-ink mb-1">{title}</h3>
      <p className="text-xs text-ink-soft max-w-md mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-panel-bg text-ink border border-line hover:bg-slate-bg transition-colors shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-ink-soft" />
          Retry
        </button>
      )}
    </div>
  );
}
