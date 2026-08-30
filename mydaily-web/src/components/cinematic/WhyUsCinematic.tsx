"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

import SectionTitle from "./SectionTitle";
import { useIsMobile, usePrefersReducedMotion } from "@/lib/media";

const POINTS = [
  { icon: "🗂️", title: "统一记录", desc: "日记、学习、生活三合一，告别散落在备忘录和相册里的碎片。" },
  { icon: "🔒", title: "私密空间", desc: "每个账号的数据严格隔离，只属于你自己。" },
  { icon: "🏆", title: "成就感回顾", desc: "学习进度一目了然，回看走过的每一天都闪闪发光。" },
  { icon: "🪶", title: "轻量无负担", desc: "打开就能写，不打扰、不社交，安静陪伴你的记录。" },
];

/** 为什么选我们：左列 / 右列以相反速率 translateX 视差，制造层次 */
export default function WhyUsCinematic() {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const factor = reduced ? 0 : isMobile ? 0.5 : 1;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const xLeft = useTransform(scrollYProgress, [0, 1], [-36 * factor, 36 * factor]);
  const xRight = useTransform(scrollYProgress, [0, 1], [36 * factor, -36 * factor]);

  return (
    <section
      ref={ref}
      className="border-y border-black/5 bg-surface/60 py-section dark:border-white/5"
      aria-labelledby="why-title"
    >
      <div className="mx-auto max-w-6xl px-pad">
        <SectionTitle
          id="why-title"
          className="mb-16 text-center font-serif text-3xl font-bold text-text sm:text-4xl"
        >
          为什么选择 藏心阁
        </SectionTitle>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {POINTS.map((p, i) => (
            <motion.div
              key={p.title}
              className="text-center"
              style={reduced ? undefined : { x: i < 2 ? xLeft : xRight }}
            >
              <div
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-card bg-primary/20 text-2xl dark:bg-primary/15"
                aria-hidden="true"
              >
                {p.icon}
              </div>
              <h3 className="mt-5 font-serif text-lg font-semibold text-text">{p.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
