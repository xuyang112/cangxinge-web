"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import ThemeToggle from "@/components/ThemeToggle";
import { Spinner } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const profileSchema = z.object({
  display_name: z.string().min(1, "请输入昵称").max(100, "昵称最长 100 字"),
});

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "请输入当前密码"),
    new_password: z
      .string()
      .min(8, "新密码至少 8 位")
      .max(72, "新密码最长 72 位")
      .refine((v) => new TextEncoder().encode(v).length <= 72, "密码过长（最多 72 字节）"),
    confirm: z.string(),
  })
  .refine((d) => d.new_password === d.confirm, {
    message: "两次输入的密码不一致",
    path: ["confirm"],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { user, logout, refreshUser } = useAuth();
  const [profileMsg, setProfileMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pwdMsg, setPwdMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { display_name: user?.display_name ?? "" },
  });
  const pwdForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const onSaveProfile = profileForm.handleSubmit(async (data) => {
    setProfileMsg(null);
    try {
      await api.put("/users/me", { display_name: data.display_name });
      await refreshUser();
      setProfileMsg({ kind: "ok", text: "昵称已更新" });
    } catch (err) {
      setProfileMsg({ kind: "error", text: err instanceof ApiError ? err.message : "保存失败" });
    }
  });

  const onChangePassword = pwdForm.handleSubmit(async (data) => {
    setPwdMsg(null);
    try {
      await api.put("/users/me", {
        current_password: data.current_password,
        new_password: data.new_password,
      });
      pwdForm.reset({ current_password: "", new_password: "", confirm: "" });
      setPwdMsg({ kind: "ok", text: "密码已更新" });
    } catch (err) {
      setPwdMsg({ kind: "error", text: err instanceof ApiError ? err.message : "修改失败" });
    }
  });

  return (
    <div className="mx-auto max-w-2xl px-pad py-10">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/app/diaries" className="btn-ghost !px-3 !py-1.5 !text-xs" aria-label="返回应用">
            ← 返回
          </Link>
          <h1 className="font-serif text-2xl font-bold text-text">设置</h1>
        </div>
        <ThemeToggle />
      </div>

      <div className="space-y-6">
        {/* 账号信息 */}
        <section className="card" aria-labelledby="account-title">
          <h2 id="account-title" className="mb-4 font-serif text-lg font-semibold text-text">
            账号信息
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">邮箱</dt>
              <dd className="font-medium text-text">{user?.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">套餐</dt>
              <dd className="font-medium text-text">{user?.plan === "pro" ? "Pro" : "免费版"}</dd>
            </div>
          </dl>
        </section>

        {/* 修改昵称 */}
        <section className="card" aria-labelledby="profile-title">
          <h2 id="profile-title" className="mb-4 font-serif text-lg font-semibold text-text">
            修改昵称
          </h2>
          {profileMsg && (
            <div
              role={profileMsg.kind === "error" ? "alert" : "status"}
              className={`mb-3 rounded-card px-4 py-3 text-sm ${
                profileMsg.kind === "ok"
                  ? "bg-accent/15 text-text"
                  : "border border-[#c0392b]/30 bg-[#c0392b]/10 text-[#c0392b]"
              }`}
            >
              {profileMsg.text}
            </div>
          )}
          <form onSubmit={onSaveProfile} noValidate className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="display_name" className="field-label">昵称</label>
              <input
                id="display_name"
                className="input"
                aria-invalid={!!profileForm.formState.errors.display_name}
                {...profileForm.register("display_name")}
              />
              {profileForm.formState.errors.display_name && (
                <p className="form-error" role="alert">{profileForm.formState.errors.display_name.message}</p>
              )}
            </div>
            <button type="submit" className="btn-primary" disabled={profileForm.formState.isSubmitting}>
              {profileForm.formState.isSubmitting ? <Spinner className="h-4 w-4" /> : "保存"}
            </button>
          </form>
        </section>

        {/* 修改密码 */}
        <section className="card" aria-labelledby="password-title">
          <h2 id="password-title" className="mb-4 font-serif text-lg font-semibold text-text">
            修改密码
          </h2>
          {pwdMsg && (
            <div
              role={pwdMsg.kind === "error" ? "alert" : "status"}
              className={`mb-3 rounded-card px-4 py-3 text-sm ${
                pwdMsg.kind === "ok"
                  ? "bg-accent/15 text-text"
                  : "border border-[#c0392b]/30 bg-[#c0392b]/10 text-[#c0392b]"
              }`}
            >
              {pwdMsg.text}
            </div>
          )}
          <form onSubmit={onChangePassword} noValidate className="space-y-4">
            <div>
              <label htmlFor="current_password" className="field-label">当前密码</label>
              <input
                id="current_password"
                type="password"
                autoComplete="current-password"
                className="input"
                aria-invalid={!!pwdForm.formState.errors.current_password}
                {...pwdForm.register("current_password")}
              />
              {pwdForm.formState.errors.current_password && (
                <p className="form-error" role="alert">{pwdForm.formState.errors.current_password.message}</p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="new_password" className="field-label">新密码</label>
                <input
                  id="new_password"
                  type="password"
                  autoComplete="new-password"
                  className="input"
                  aria-invalid={!!pwdForm.formState.errors.new_password}
                  {...pwdForm.register("new_password")}
                />
                {pwdForm.formState.errors.new_password && (
                  <p className="form-error" role="alert">{pwdForm.formState.errors.new_password.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="confirm" className="field-label">确认新密码</label>
                <input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  className="input"
                  aria-invalid={!!pwdForm.formState.errors.confirm}
                  {...pwdForm.register("confirm")}
                />
                {pwdForm.formState.errors.confirm && (
                  <p className="form-error" role="alert">{pwdForm.formState.errors.confirm.message}</p>
                )}
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={pwdForm.formState.isSubmitting}>
              {pwdForm.formState.isSubmitting ? <Spinner className="h-4 w-4" /> : "更新密码"}
            </button>
          </form>
        </section>

        {/* 退出登录 */}
        <section className="card border-[#c0392b]/20" aria-labelledby="logout-title">
          <h2 id="logout-title" className="mb-3 font-serif text-lg font-semibold text-text">
            退出登录
          </h2>
          <p className="mb-4 text-sm text-muted">退出后将回到首页，下次需要重新登录。</p>
          <button
            type="button"
            className="btn-danger"
            disabled={loggingOut}
            onClick={async () => {
              setLoggingOut(true);
              await logout();
            }}
          >
            {loggingOut ? <Spinner className="h-4 w-4" /> : "退出登录"}
          </button>
        </section>
      </div>
    </div>
  );
}
