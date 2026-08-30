"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

import { usePrefersReducedMotion } from "@/lib/media";

/** 区块大标题：滚动到视口中心时从 blur(8px) 过渡到 blur(0)，opacity 0.4 → 1 */
export default function SectionTitle({
  id,
  className = "",
  children,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  const reduced = usePrefersReducedMotion();
  return (
    <motion.h2
      id={id}
      className={className}
      initial={reduced ? false : { opacity: 0.4, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-20% 0px -15% 0px" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.h2>
  );
}
