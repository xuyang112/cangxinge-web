"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import AuthLayout from "@/components/auth/AuthLayout";
import { Spinner } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const schema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(1, "请输入密码"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { user, loading: authLoading } = useAuth();
  const [next, setNext] = useState("/app");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // 已登录访问登录页 → 跳转 /app
  useEffect(() => {
    if (!authLoading && user) window.location.href = "/app";
  }, [authLoading, user]);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("next");
    if (p && p.startsWith("/")) setNext(p);
  }, []);

  const onSubmit = handleSubmit(async (data) => {
    setSubmitError(null);
    try {
      await api.post("/auth/login", { email: data.email, password: data.password });
      window.location.href = next; // 整页跳转，让 marker cookie 与状态干净落地
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "登录失败，请重试");
    }
  });

  return (
    <AuthLayout
      title="欢迎回来"
      subtitle="登录后继续你的记录"
      footer={
        <>
          还没有账号？{" "}
          <Link href="/register" className="font-medium text-text underline underline-offset-2">
            立即注册
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {submitError && (
          <div role="alert" className="rounded-card border border-[#c0392b]/30 bg-[#c0392b]/10 px-4 py-3 text-sm text-[#c0392b]">
            {submitError}
          </div>
        )}
        <div>
          <label htmlFor="email" className="field-label">
            邮箱
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="input"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email && <p className="form-error" role="alert">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="password" className="field-label">
            密码
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="input"
            placeholder="请输入密码"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          {errors.password && <p className="form-error" role="alert">{errors.password.message}</p>}
        </div>
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full !py-3">
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Spinner className="h-4 w-4" /> 登录中…
            </span>
          ) : (
            "登录"
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
