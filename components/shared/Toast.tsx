import React, { createContext, useContext, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextType {
  toast: (options: { type: ToastType; title: string; description?: string }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, description }: { type: ToastType; title: string; description?: string }) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
      const newToast: ToastMessage = { id, type, title, description };

      setToasts((prev) => [...prev, newToast]);

      // Auto dismiss after 4 seconds
      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  const success = useCallback((title: string, description?: string) => addToast({ type: "success", title, description }), [addToast]);
  const error = useCallback((title: string, description?: string) => addToast({ type: "error", title, description }), [addToast]);
  const info = useCallback((title: string, description?: string) => addToast({ type: "info", title, description }), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info }}>
      {children}

      {/* Floating Toast Container (Bottom Right) */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto p-4 rounded-xl border shadow-lg flex items-start gap-3 transition-all animate-in slide-in-from-bottom-5 duration-200 text-xs",
              t.type === "success" && "bg-panel-bg border-green-200 text-ink",
              t.type === "error" && "bg-panel-bg border-red-200 text-ink",
              t.type === "info" && "bg-panel-bg border-line text-ink"
            )}
          >
            {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />}
            {t.type === "error" && <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />}
            {t.type === "info" && <Info className="w-5 h-5 text-amber shrink-0 mt-0.5" />}

            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-ink">{t.title}</h4>
              {t.description && <p className="text-ink-soft mt-0.5">{t.description}</p>}
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="text-ink-soft hover:text-ink p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
