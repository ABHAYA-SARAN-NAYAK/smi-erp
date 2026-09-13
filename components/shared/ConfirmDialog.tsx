"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const buttonVariantClass =
    variant === "danger"
      ? "bg-danger hover:bg-danger/90 text-white"
      : variant === "warning"
      ? "bg-amber hover:bg-amber/90 text-white"
      : "bg-ink hover:bg-ink/90 text-white";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Modal Card */}
      <div className="relative bg-panel-bg border border-line rounded-2xl p-6 shadow-2xl max-w-md w-full z-10 space-y-4 text-xs animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2.5 rounded-xl flex items-center justify-center shrink-0",
                variant === "danger" && "bg-red-50 text-danger border border-red-200",
                variant === "warning" && "bg-amber-soft text-amber border border-amber/30",
                variant === "info" && "bg-slate-bg text-ink border border-line"
              )}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink font-display">{title}</h3>
              <p className="text-ink-soft mt-0.5">{message}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-ink-soft hover:text-ink p-1 rounded-lg hover:bg-slate-bg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="pt-3 border-t border-line flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 font-semibold text-ink bg-panel-bg border border-line rounded-lg hover:bg-slate-bg transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "px-4 py-2 font-semibold rounded-lg transition-all shadow-xs disabled:opacity-50",
              buttonVariantClass
            )}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
