import React from "react";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  variant?: "table" | "card" | "form" | "custom";
  rows?: number;
  className?: string;
}

export function LoadingSkeleton({
  variant = "table",
  rows = 5,
  className,
}: LoadingSkeletonProps) {
  if (variant === "card") {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="p-5 border border-line rounded-xl bg-panel-bg space-y-3 animate-pulse"
          >
            <div className="h-3 w-1/3 bg-line rounded" />
            <div className="h-7 w-1/2 bg-line rounded" />
            <div className="h-3 w-2/3 bg-line rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "form") {
    return (
      <div className={cn("p-6 border border-line rounded-xl bg-panel-bg space-y-5 animate-pulse", className)}>
        <div className="h-5 w-1/4 bg-line rounded" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 bg-line rounded" />
          <div className="h-10 bg-line rounded" />
        </div>
        <div className="h-24 bg-line rounded" />
        <div className="h-10 w-32 bg-line rounded" />
      </div>
    );
  }

  // Table Skeleton
  return (
    <div className={cn("border border-line rounded-xl overflow-hidden bg-panel-bg animate-pulse", className)}>
      <div className="h-10 bg-slate-bg border-b border-line flex items-center px-4 gap-4">
        <div className="h-4 w-1/6 bg-line rounded" />
        <div className="h-4 w-1/3 bg-line rounded" />
        <div className="h-4 w-1/4 bg-line rounded" />
        <div className="h-4 w-1/6 bg-line rounded" />
      </div>
      <div className="divide-y divide-line">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-12 flex items-center px-4 gap-4">
            <div className="h-3.5 w-1/6 bg-line/70 rounded" />
            <div className="h-3.5 w-1/3 bg-line/70 rounded" />
            <div className="h-3.5 w-1/4 bg-line/70 rounded" />
            <div className="h-3.5 w-1/6 bg-line/70 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
