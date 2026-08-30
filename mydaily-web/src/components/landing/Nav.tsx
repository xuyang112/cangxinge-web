"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * 官网顶部导航（深色霓虹风格）：品牌渐变字 + 锚点导航 + 渐变胶囊 CTA。
 * 滚动 >50px 后玻璃毛玻璃贴底。
 */
export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed left-0 top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? "nav-scrolled" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold gradient-text">
          藏心阁
        </Link>
        <div className="hidden gap-8 text-sm text-white/70 md:flex">
          <a href="#features" className="transition hover:text-white">
            功能
          </a>
          <a href="#privacy" className="transition hover:text-white">
            隐私
          </a>
          <a href="#steps" className="transition hover:text-white">
            开始
          </a>
        </div>
        <Link
          href="/register"
          className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-2 text-sm font-medium transition hover:scale-105"
        >
          获取访问
        </Link>
      </div>
    </nav>
  );
}
