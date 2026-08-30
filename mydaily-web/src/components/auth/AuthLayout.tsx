import Link from "next/link";
import type { ReactNode } from "react";
import ThemeToggle from "@/components/ThemeToggle";

/** 登录/注册页共用布局：居中卡片 */
export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-bg px-pad py-12">
      {/* 左上角：返回首页 */}
      <div className="absolute left-4 top-4">
        <Link href="/" className="btn-ghost !px-4 !py-2 !text-sm" aria-label="返回首页">
          <span aria-hidden="true">←</span> 返回首页
        </Link>
      </div>
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-block font-serif text-2xl font-bold tracking-wide text-text transition-opacity hover:opacity-75"
            aria-label="藏心阁 首页"
          >
            藏心阁
          </Link>
          <h1 className="mt-5 font-serif text-2xl font-semibold text-text sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
        </div>
        <div className="card">{children}</div>
        <div className="mt-6 text-center text-sm text-muted">{footer}</div>
      </div>
    </main>
  );
}
