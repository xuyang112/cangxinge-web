import type { Metadata, Viewport } from "next";

import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ThemeInitScript, ThemeProvider } from "@/lib/theme";

export const metadata: Metadata = {
  title: {
    default: "藏心阁 - 记录你的每一天",
    template: "%s | 藏心阁",
  },
  description: "日记 · 学习 · 生活，一个就够了。个人记录 SaaS，私密、轻量、治愈。",
  openGraph: {
    title: "藏心阁 - 记录你的每一天",
    description: "把心事，藏进一座阁楼。日记、学习与生活的私密个人记录空间。",
    type: "website",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary",
    title: "藏心阁 - 记录你的每一天",
    description: "把心事，藏进一座阁楼。日记、学习与生活的私密个人记录空间。",
  },
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#FAF9F6",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <ThemeInitScript />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&family=Noto+Serif+SC:wght@400;500;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
