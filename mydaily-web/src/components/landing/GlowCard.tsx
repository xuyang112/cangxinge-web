"use client";

import { useRef } from "react";
import type { CSSProperties, ReactNode } from "react";

/**
 * MagicBento 风格的"边框光效"卡片：
 * 光标在卡片上移动时，沿边框出现一道跟随光线的紫光描边（CSS mask 实现，
 * 由 --glow-x/--glow-y/--glow-intensity 变量驱动）。
 */
export default function GlowCard({
  className = "",
  style,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    el.style.setProperty("--glow-x", `${x}%`);
    el.style.setProperty("--glow-y", `${y}%`);
    el.style.setProperty("--glow-intensity", "1");
  };

  const onMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--glow-intensity", "0");
  };

  return (
    <div
      ref={ref}
      className={`glow-card ${className}`.trim()}
      style={style}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  );
}
