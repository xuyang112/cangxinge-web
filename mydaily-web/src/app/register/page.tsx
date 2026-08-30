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

const schema = z
  .object({
    display_name: z.string().min(1, "请输入昵称").max(100, "昵称最长 100 字"),
    email: z.string().email("请输入有效的邮箱地址"),
    password: z
      .string()
      .min(8, "密码至少 8 位")
      .max(72, "密码最长 72 位")
      .refine((v) => new TextEncoder().encode(v).length <= 72, "密码过长（最多 72 字节）"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "两次输入的密码不一致",
    path: ["confirm"],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { user, loading: authLoading } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // 已登录访问注册页 → 跳转 /app
  useEffect(() => {
    if (!authLoading && user) window.location.href = "/app";
  }, [authLoading, user]);

  const onSubmit = handleSubmit(async (data) => {
    setSubmitError(null);
    try {
      await api.post("/auth/register", {
        email: data.email,
        password: data.password,
        display_name: data.display_name,
      });
      window.location.href = "/app";
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "注册失败，请重试");
    }
  });

  return (
    <AuthLayout
      title="创建你的账号"
      subtitle="免费开始记录每一天"
      footer={
        <>
          已有账号？{" "}
          <Link href="/login" className="font-medium text-text underline underline-offset-2">
            直接登录
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
          <label htmlFor="display_name" className="field-label">
            昵称
          </label>
          <input
            id="display_name"
            type="text"
            autoComplete="nickname"
            className="input"
            placeholder="怎么称呼你"
            aria-invalid={!!errors.display_name}
            {...register("display_name")}
          />
          {errors.display_name && <p className="form-error" role="alert">{errors.display_name.message}</p>}
        </div>
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
            autoComplete="new-password"
            className="input"
            placeholder="至少 8 位"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          {errors.password && <p className="form-error" role="alert">{errors.password.message}</p>}
        </div>
        <div>
          <label htmlFor="confirm" className="field-label">
            确认密码
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            className="input"
            placeholder="再输入一次"
            aria-invalid={!!errors.confirm}
            {...register("confirm")}
          />
          {errors.confirm && <p className="form-error" role="alert">{errors.confirm.message}</p>}
        </div>
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full !py-3">
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Spinner className="h-4 w-4" /> 注册中…
            </span>
          ) : (
            "注册"
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
