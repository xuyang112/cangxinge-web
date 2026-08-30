"use client";

import { useState, type ReactNode } from "react";

/** 轻量加载态 / 空态 / 错误提示 */

export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function LoadingBlock({ text = "加载中…" }: { text?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted" role="status" aria-live="polite">
      <Spinner />
      <span className="text-sm">{text}</span>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  desc,
  action,
}: {
  icon?: string;
  title: string;
  desc?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      {icon && <div className="text-4xl" aria-hidden="true">{icon}</div>}
      <p className="font-serif text-lg font-semibold text-text">{title}</p>
      {desc && <p className="max-w-sm text-sm text-muted">{desc}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div
      role="alert"
      className="mb-4 flex items-center justify-between gap-3 rounded-card border border-[#c0392b]/30 bg-[#c0392b]/10 px-4 py-3 text-sm text-[#c0392b]"
    >
      <span>{message}</span>
      <span className="flex shrink-0 items-center gap-2">
        {onRetry && (
          <button type="button" onClick={onRetry} className="font-medium underline underline-offset-2">
            重试
          </button>
        )}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="关闭提示"
          className="text-current/70 hover:text-current"
        >
          ✕
        </button>
      </span>
    </div>
  );
}
