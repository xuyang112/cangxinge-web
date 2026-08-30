"use client";

/**
 * 认证状态管理：对接后端 /api/v1（httpOnly cookie，credentials: 'include'）。
 * - 挂载时调用 /users/me 校验登录态
 * - login/register/logout 封装后端接口
 * - 未登录访问受保护页面由 AuthGuard 客户端跳转 /login（不改变源，避免跨站 cookie 丢失）
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { api, ApiError } from "./api";
import type { User } from "./types";

interface AuthContextValue {
  user: User | null;
  /** 首次挂载校验中 */
  loading: boolean;
  login: (email: string, password: string, redirectTo?: string) => Promise<void>;
  register: (email: string, password: string, displayName: string, redirectTo?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const me = await api.get<User>("/users/me");
      setUser(me);
      return me;
    } catch (err) {
      setUser(null);
      if (!(err instanceof ApiError && err.status === 401)) {
        // 网络错误等：不进入未登录态，避免误跳转
        setLoading(false);
      }
      return null;
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const me = await api.get<User>("/users/me");
        if (alive) setUser(me);
      } catch {
        if (alive) setUser(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string, redirectTo = "/app") => {
      const me = await api.post<User>("/auth/login", { email, password });
      setUser(me);
      router.push(redirectTo);
    },
    [router],
  );

  const register = useCallback(
    async (email: string, password: string, displayName: string, redirectTo = "/app") => {
      const me = await api.post<User>("/auth/register", {
        email,
        password,
        display_name: displayName,
      });
      setUser(me);
      router.push(redirectTo);
    },
    [router],
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      /* 忽略登出接口错误，本地照常清理 */
    }
    setUser(null);
    router.push("/");
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, register, logout, refreshUser }),
    [user, loading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
