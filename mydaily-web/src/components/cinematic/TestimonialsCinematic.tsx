"use client";

import { motion } from "motion/react";

import SectionTitle from "./SectionTitle";
import Reveal from "./Reveal";
import { usePrefersReducedMotion } from "@/lib/media";

const REVIEWS = [
  {
    name: "林晚",
    role: "产品设计师",
    quote: "每天睡前花两分钟写日记，一年后回看，那些平凡的日子突然都有了光。",
  },
  {
    name: "陈屿",
    role: "在读研究生",
    quote: "把读过的书和课程都记下来，进度条推着我一点点把计划走完，很有成就感。",
  },
  {
    name: "苏禾",
    role: "自由职业者",
    quote: "像朋友圈一样记录生活，但又完全属于自己，安静、治愈、不被打扰。",
  },
];

/** 用户评价：每条从下方淡入，配合轻微 scale 0.96 → 1 */
export default function TestimonialsCinematic() {
  const reduced = usePrefersReducedMotion();
  return (
    <section className="mx-auto max-w-6xl px-pad py-section" aria-labelledby="reviews-title">
      <div className="mb-16 text-center">
        <SectionTitle
          id="reviews-title"
          className="font-serif text-3xl font-bold text-text sm:text-4xl"
        >
          他们都在用 藏心阁
        </SectionTitle>
        <Reveal delay={0.1} y={20}>
          <p className="mx-auto mt-5 max-w-md text-sm text-muted">安静而治愈的记录体验，得到很多人的喜欢。</p>
        </Reveal>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {REVIEWS.map((r, i) => (
          <motion.figure
            key={r.name}
            className="card !p-8"
            initial={reduced ? false : { opacity: 0, y: 40, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            transition={{ duration: 0.8, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <blockquote className="text-sm leading-relaxed text-text">“{r.quote}”</blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-pill bg-accent/25 font-serif text-base font-semibold text-text"
                aria-hidden="true"
              >
                {r.name[0]}
              </span>
              <span>
                <span className="block text-sm font-medium text-text">{r.name}</span>
                <span className="block text-xs text-muted">{r.role}</span>
              </span>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}
