"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme";

/** 主题切换按钮：🌙 / ☀️（尊重系统偏好，默认跟随系统） */
export default function ThemeToggle({
  className = "",
  label = "切换主题",
}: {
  className?: string;
  label?: string;
}) {
  const { resolved, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-pill border border-black/5 bg-white text-base transition-transform hover:scale-105 dark:border-white/10 dark:bg-surface ${className}`}
    >
      <span aria-hidden="true">{mounted && resolved === "dark" ? "☀️" : "🌙"}</span>
    </button>
  );
}
