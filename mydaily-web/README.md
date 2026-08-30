# mydaily-web

个人记录 SaaS（日记 / 学习资料 / 生活动态）的前端，基于 **Next.js 15 + TypeScript(strict) + Tailwind CSS**，对接后端 [mydaily-api](../mydaily-api)。

## 技术栈

- Next.js 15 App Router + React 19 + TypeScript strict
- Tailwind CSS（设计令牌走 CSS 变量，暗色模式 `.dark` 类，默认跟随系统）
- React Hook Form + Zod 表单校验
- 原生 fetch 统一封装 `apiClient`（credentials: 'include'，自动携带 httpOnly cookie；401 自动 refresh 重试）
- 认证：JWT 以 **httpOnly cookie** 形式存储在后端域（`127.0.0.1:8000`），前端 JS 无法读取，天然防 XSS；`apiClient` 所有请求 `credentials: 'include'`，收到 401 自动调用 `/auth/refresh` 换新并重试一次。
- 未登录访问 `/app`、`/settings` 由客户端 `AuthGuard` 通过 `/users/me` 校验后自动跳转 `/login`（`router.replace`，不换源）；已登录访问 `/login`、`/register` 自动跳转 `/app`。
  > 说明：未使用 Next 中间件做重定向 —— 实测 Next 会把 `127.0.0.1` 规范化为 `localhost`，
  > 而浏览器将 `localhost` 与 `127.0.0.1` 视为跨站，跳到 localhost 会导致 `SameSite=Lax` 的
  > 认证 cookie 无法随跨站 fetch 发送，登录态会断裂。客户端跳转不改变源，无此问题。

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local

# 3. 启动后端（见 mydaily-api/README，默认 http://127.0.0.1:8000）

# 4. 启动开发服务器
npm run dev
```

> ⚠️ **请用 `http://127.0.0.1:3000` 访问**（而非 localhost）：后端 cookie 为 `SameSite=Lax`，
> 浏览器将 `localhost` 与 `127.0.0.1` 视为跨站，跨站 fetch 不会携带 Lax cookie；
> 前后端同用 `127.0.0.1` 属同站，cookie 正常流转。后端 CORS 已默认放行 `http://127.0.0.1:3000`。

生产构建：`npm run build && npm run start`。

## 页面结构

| 路由 | 说明 |
| --- | --- |
| `/` | 官网落地页（粒子 Hero、功能、卖点、评价、伙伴条、Footer） |
| `/login` `/register` | 登录 / 注册（居中卡片，RHF+Zod） |
| `/app` | 应用主界面（未登录自动跳 `/login`） |
| `/app/diaries` | 日记：列表 + 新增/编辑/删除 + 心情标签 |
| `/app/study` | 学习：类型筛选 + 新增/编辑/删除 + 进度条 |
| `/app/life` | 生活：朋友圈卡片流 + 多图上传预览发文 |
| `/settings` | 设置：改昵称 / 改密码 / 退出登录 |

## 认证说明

- JWT 以 **httpOnly cookie** 形式存储在后端域（`127.0.0.1:8000`），前端 JS 无法读取，天然防 XSS。
- `apiClient` 所有请求 `credentials: 'include'`；收到 401 时自动调用 `/auth/refresh` 换新并重试一次。
- 未登录访问 `/app`、`/settings` 由客户端守卫自动跳转 `/login`；已登录访问 `/login`、`/register` 自动跳转 `/app`（见上文说明，不使用 Next middleware 重定向）。
- 图片上传：先本地预览 → 后端预签名（R2 PUT）→ 未配置 R2 时走后端本地 multipart 接口
- React Bits 风格 ParticleText 粒子标题（懒加载 + ssr:false + 移动端静态降级 + prefers-reduced-motion 降级）

## 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE` | `http://127.0.0.1:8000` | 后端 API 基础路径（浏览器可见，勿放密钥） |

## 设计

- 配色（浅色治愈系）：米白 `#FAF9F6` / 暖卡其 `#C8B79E` / 浅绿 `#A3B18A` / 深棕文字 `#2D2A26`，全部走 CSS 变量，暗色模式一键切换。
- 字体：标题 Noto Serif SC（衬线），正文 Noto Sans SC（无衬线），Google Fonts 加载（离线时回退系统字体）。
- 卡片 16px 圆角、按钮 9999px 胶囊、区块间距 96px。
- 动效：上升淡入 `rise`（cubic-bezier(.22,1,.36,1)），尊重 `prefers-reduced-motion`。

## 目录结构

```
mydaily-web/
├── src/
│   ├── app/                  # App Router 页面
│   │   ├── layout.tsx        # 根布局（主题/认证 Provider、字体）
│   │   ├── page.tsx          # 落地页
│   │   ├── login/ register/  # 认证页
│   │   ├── app/              # 应用主界面（diaries/study/life）
│   │   └── settings/         # 设置
│   ├── components/
│   │   ├── ParticleText.jsx  # 粒子文字（React Bits 风格）
│   │   ├── landing/          # 落地页区块
│   │   ├── app/              # 应用组件（面板/弹窗/上传器/守卫）
│   │   └── Modal.tsx / ThemeToggle.tsx / ui.tsx
│   └── lib/
│       ├── api.ts            # apiClient（cookie + 错误处理 + 401 自动刷新）
│       ├── auth.tsx          # AuthProvider / useAuth（客户端登录守卫）
│       ├── theme.tsx         # 主题 Provider（light/dark/system）
│       └── types.ts          # 与后端对齐的类型
├── tailwind.config.ts / postcss.config.mjs / next.config.mjs
└── .env.example
```
