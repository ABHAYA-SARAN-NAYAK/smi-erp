import React from "react";
import { cn } from "@/lib/utils";

export type StatusType =
  | "Paid"
  | "Complete"
  | "Active"
  | "Pending"
  | "Partially Paid"
  | "Overdue"
  | "Cancelled"
  | "Absent"
  | "Present"
  | string;

interface StatusPillProps {
  status: StatusType;
  label?: string;
  className?: string;
}

export function StatusPill({ status, label, className }: StatusPillProps) {
  const displayText = label || status;
  const s = status.toLowerCase();

  let colorClasses = "bg-[#21232c] text-[#8b8fa3] border-[#2a2d38]"; // default fallback

  if (s === "paid" || s === "complete" || s === "active" || s === "present") {
    colorClasses = "bg-emerald-500/15 text-emerald-400 border-emerald-500/35 font-semibold";
  } else if (s === "pending" || s === "partially paid" || s === "warning") {
    colorClasses = "bg-amber-500/15 text-amber-400 border-amber-500/35 font-semibold";
  } else if (s === "overdue" || s === "cancelled" || s === "absent" || s === "danger") {
    colorClasses = "bg-rose-500/15 text-rose-400 border-rose-500/35 font-semibold";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider border transition-colors shadow-2xs",
        colorClasses,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-90" />
      {displayText}
    </span>
  );
}
