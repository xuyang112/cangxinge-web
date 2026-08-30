"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import Nav from "@/components/landing/Nav";
import Footer from "@/components/landing/Footer";
import ParticleNetwork from "@/components/landing/ParticleNetwork";
import GlowCard from "@/components/landing/GlowCard";
import "@/components/landing/landing-dark.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const FEATURES = [
  {
    icon: "📓",
    title: "私人日记",
    desc: "记录每一天的心事。支持富文本、心情标签、时间线浏览。所有内容本地加密，只有你能打开。",
  },
  {
    icon: "🎓",
    title: "学习资料库",
    desc: "整理笔记、文档、链接。支持分类标签、全文搜索、Markdown 编辑。你的知识，有序安放。",
  },
  {
    icon: "🖼️",
    title: "生活照片集",
    desc: "私密存储生活瞬间。支持原画质备份、相册分类、时间地点标记。不压缩、不上传社交平台。",
  },
];

const PRIVACY_POINTS = [
  { title: "端到端加密", desc: "AES-256-GCM 加密，密钥仅存本地" },
  { title: "零广告零追踪", desc: "不收集行为数据，不做用户画像" },
  { title: "独立密钥", desc: "每个用户独立加密密钥，互不可见" },
];

const STEPS = [
  { num: "01", color: "text-purple-400", title: "创建阁楼", desc: "注册账号，生成独立加密密钥" },
  { num: "02", color: "text-blue-400", title: "导入心事", desc: "写下第一篇日记、上传照片和资料" },
  { num: "03", color: "text-cyan-400", title: "安心存放", desc: "数据自动加密同步，随时访问" },
];

export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    // 尊重"减少动态"：跳过所有入场/揭示动画，直接显示内容
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      // Hero 文案入场
      gsap.from("#hero-text > *", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out",
        delay: 0.3,
      });
      // Hero 星链网络入场
      gsap.from("#hero-network", {
        x: 60,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        delay: 0.6,
      });

      // 各区块滚动揭示（feature-card 由 #features onEnter 单独错开处理）
      (gsap.utils.toArray(".reveal", root) as Element[]).forEach((el) => {
        if (el.classList.contains("feature-card")) return;
        gsap.fromTo(
          el,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        );
      });

      // 功能卡片：进入 #features 时错开上浮
      ScrollTrigger.create({
        trigger: "#features",
        start: "top 70%",
        onEnter: () => {
          gsap.fromTo(
            ".feature-card",
            { y: 60, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.7, stagger: 0.15, ease: "power3.out", clearProps: "transform" }
          );
        },
      });

      ScrollTrigger.refresh();
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="cangxinge-landing relative min-h-screen overflow-hidden">
      {/* 背景漂浮光斑 */}
      <div className="blob blob-1" aria-hidden="true" />
      <div className="blob blob-2" aria-hidden="true" />
      <div className="blob blob-3" aria-hidden="true" />

      <Nav />

      {/* ===================== Hero ===================== */}
      <section className="relative flex min-h-screen items-center justify-center px-6 pt-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2">
          <div id="hero-text">
            <h1 className="mb-6 text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-tight text-glow">
              <span className="gradient-text">把心事</span>
              <br />
              藏进一座阁楼
            </h1>
            <p className="mb-8 max-w-md text-lg leading-relaxed text-white/60">
              集私密日记、学习资料库、生活照片集于一体。你的记忆，只属于你。端到端加密，零第三方共享。
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/register"
                className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-3 font-medium transition hover:scale-105"
              >
                免费开始
              </Link>
              <a
                href="#features"
                className="glass rounded-full px-8 py-3 font-medium transition hover:bg-white/10"
              >
                了解更多
              </a>
            </div>
          </div>

          <div id="hero-network" className="flex justify-center">
            <ParticleNetwork />
          </div>
        </div>
      </section>

      {/* ===================== 功能 ===================== */}
      <section id="features" className="relative scroll-mt-24 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <h2 className="reveal mb-16 text-center text-3xl font-bold gradient-text md:text-4xl">
            装下全部心事
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div className="reveal feature-card glass p-8" key={f.title}>
                <div className="mb-4 text-4xl" aria-hidden="true">
                  {f.icon}
                </div>
                <h3 className="mb-3 text-xl font-bold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-white/50">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== 隐私 ===================== */}
      <section id="privacy" className="relative scroll-mt-24 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="reveal glass p-12 text-center md:p-16">
            <div className="mb-6 text-5xl" aria-hidden="true">
              🔒
            </div>
            <h2 className="mb-6 text-3xl font-bold md:text-4xl">你的数据只属于你</h2>
            <p className="mx-auto mb-10 max-w-2xl leading-relaxed text-white/50">
              藏心阁采用端到端加密（E2EE），你的日记、资料、照片在离开设备前就已加密。我们看不到、第三方拿不走、服务器存不了明文。
            </p>
            <div className="grid gap-6 text-left md:grid-cols-3">
              {PRIVACY_POINTS.map((p) => (
                <GlowCard className="reveal glass p-6" key={p.title}>
                  <div className="mb-2 text-lg font-bold text-emerald-400">{p.title}</div>
                  <div className="text-sm text-white/50">{p.desc}</div>
                </GlowCard>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===================== 三步入驻 ===================== */}
      <section id="steps" className="relative scroll-mt-24 px-6 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="reveal mb-12 text-3xl font-bold gradient-text md:text-4xl">三步入驻</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {STEPS.map((s) => (
              <div className="reveal glass p-8" key={s.num}>
                <div className={`mb-4 text-3xl font-bold ${s.color}`}>{s.num}</div>
                <h3 className="mb-2 font-bold">{s.title}</h3>
                <p className="text-sm text-white/50">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="reveal mt-12">
            <Link
              href="/register"
              className="inline-block rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-10 py-4 text-lg font-bold transition hover:scale-105"
            >
              立即开始使用
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
