"use client";

import { ReactNode, useEffect } from "react";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  footer?: ReactNode;
};

export function ConfirmModal({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  onConfirm,
  onClose,
  footer
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-panel">
        <h3 className="text-lg font-semibold text-slateInk dark:text-slate-100">{title}</h3>
        {description && <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{description}</p>}
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-sm font-medium text-slateInk dark:text-slate-100 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-mint px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Working..." : confirmText}
          </button>
        </div>
        {footer ? <div className="mt-3">{footer}</div> : null}
      </div>
    </div>
  );
}
