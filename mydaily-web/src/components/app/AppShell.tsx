"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import ThemeToggle from "@/components/ThemeToggle";

/** 应用壳：桌面顶部导航 / 移动端底部 Tab 栏 + 登录守卫 */

const NAV_ITEMS = [
  { href: "/app/diaries", label: "日记", icon: "📖" },
  { href: "/app/study", label: "学习", icon: "📚" },
  { href: "/app/life", label: "生活", icon: "📷" },
];

function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3 text-muted" role="status" aria-live="polite">
          <Spinner className="h-8 w-8" />
          <span className="text-sm">加载中…</span>
        </div>
      </div>
    );
  }
  if (!user) return null; // 等待重定向
  return <>{children}</>;
}

export { AuthGuard };

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (href: string) =>
    pathname === href || (href !== "/app/diaries" && pathname.startsWith(href));

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-bg">
        {/* 顶部栏（桌面） */}
        <header className="sticky top-0 z-40 hidden border-b border-black/5 bg-bg/80 backdrop-blur-md dark:border-white/5 md:block">
          <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-pad">
            <Link href="/" className="font-serif text-lg font-bold text-text" aria-label="返回官网首页">
              藏心阁
            </Link>
            <nav aria-label="应用导航" className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`rounded-pill px-4 py-2 text-sm transition-colors ${
                    isActive(item.href)
                      ? "bg-primary/25 font-medium text-text"
                      : "text-muted hover:bg-black/5 hover:text-text dark:hover:bg-white/10"
                  }`}
                >
                  <span aria-hidden="true" className="mr-1">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <ThemeToggle label="切换主题" />
              <Link
                href="/settings"
                aria-label="设置"
                className={`flex h-9 w-9 items-center justify-center rounded-pill text-muted transition-colors hover:bg-black/5 hover:text-text dark:hover:bg-white/10 ${
                  pathname.startsWith("/settings") ? "bg-primary/25 text-text" : ""
                }`}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6" />
                  <path
                    d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1.03 1.56V21a2 2 0 11-4 0v-.09a1.7 1.7 0 00-1.1-1.56 1.7 1.7 0 00-1.88.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.7 1.7 0 004.6 15a1.7 1.7 0 00-1.55-1.03H3a2 2 0 110-4h.09A1.7 1.7 0 004.6 8.9a1.7 1.7 0 00-.34-1.88l-.06-.06a2 2 0 112.83-2.83l.06.06A1.7 1.7 0 008.9 4.6h.01A1.7 1.7 0 0010 3.1V3a2 2 0 114 0v.09c0 .68.4 1.29 1.02 1.56a1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06a1.7 1.7 0 00-.34 1.87v.01c.27.62.88 1.02 1.56 1.02H21a2 2 0 110 4h-.09c-.68 0-1.29.4-1.56 1.02z"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
              <span className="hidden max-w-[120px] truncate text-sm font-medium text-text lg:block">
                {user?.display_name}
              </span>
              <button type="button" onClick={() => logout()} className="btn-ghost !px-4 !py-1.5 !text-sm">
                退出
              </button>
            </div>
          </div>
        </header>

        {/* 移动端顶部（精简） */}
        <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-black/5 bg-bg/80 px-pad backdrop-blur-md dark:border-white/5 md:hidden">
          <Link href="/" className="font-serif text-base font-bold text-text" aria-label="返回官网首页">
            藏心阁
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/settings"
              aria-label="设置"
              className="flex h-8 w-8 items-center justify-center rounded-pill text-muted"
            >
              ⚙️
            </Link>
            <ThemeToggle label="切换主题" className="!h-8 !w-8" />
          </div>
        </header>

        {/* 内容区 */}
        <main className="mx-auto w-full max-w-4xl flex-1 px-pad pb-24 pt-6 md:pb-12">{children}</main>

        {/* 移动端底部 Tab 栏 */}
        <nav
          aria-label="应用导航"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-surface/95 backdrop-blur-md dark:border-white/5 md:hidden"
        >
          <ul className="grid grid-cols-4">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors ${
                    isActive(item.href) ? "font-medium text-text" : "text-muted"
                  }`}
                >
                  <span aria-hidden="true" className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/settings"
                aria-current={pathname.startsWith("/settings") ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors ${
                  pathname.startsWith("/settings") ? "font-medium text-text" : "text-muted"
                }`}
              >
                <span aria-hidden="true" className="text-lg">⚙️</span>
                设置
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </AuthGuard>
  );
}
