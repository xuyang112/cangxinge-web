"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import ConfirmDialog from "@/components/app/ConfirmDialog";
import Modal from "@/components/Modal";
import { EmptyState, ErrorBanner, LoadingBlock, Spinner } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { formatDateTime, MOODS, type Diary, type ListResponse } from "@/lib/types";

const schema = z.object({
  title: z.string().min(1, "请输入标题").max(255, "标题最长 255 字"),
  content: z.string().max(20000, "内容过长"),
  mood: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function DiaryPanel() {
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Diary | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Diary | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<ListResponse<Diary>>("/diaries?limit=100");
      setDiaries(data.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "加载失败，请重试");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    reset({ title: "", content: "", mood: "" });
    setSaveError(null);
    setModalOpen(true);
  };

  const openEdit = (d: Diary) => {
    setEditing(d);
    reset({ title: d.title, content: d.content, mood: d.mood ?? "" });
    setSaveError(null);
    setModalOpen(true);
  };

  const onSubmit = handleSubmit(async (data) => {
    setSaving(true);
    setSaveError(null);
    try {
      const payload = { title: data.title, content: data.content, mood: data.mood || null };
      if (editing) {
        await api.put(`/diaries/${editing.id}`, payload);
      } else {
        await api.post("/diaries", payload);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "保存失败，请重试");
    } finally {
      setSaving(false);
    }
  });

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/diaries/${deleteTarget.id}`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "删除失败，请重试");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-text">日记</h1>
          <p className="mt-1 text-sm text-muted">共 {diaries.length} 篇，按日期倒序</p>
        </div>
        <button type="button" className="btn-primary" onClick={openCreate}>
          ＋ 写日记
        </button>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      {loading ? (
        <LoadingBlock />
      ) : diaries.length === 0 ? (
        <EmptyState
          icon="📖"
          title="还没有日记"
          desc="写下第一篇日记，开始记录你的每一天"
          action={
            <button type="button" className="btn-primary" onClick={openCreate}>
              写第一篇
            </button>
          }
        />
      ) : (
        <ul className="space-y-4">
          {diaries.map((d) => (
            <li key={d.id} className="card transition-shadow hover:shadow-pop">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-serif text-lg font-semibold text-text">{d.title}</h2>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted line-clamp-3">
                    {d.content || "（无正文）"}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <time dateTime={d.created_at}>{formatDateTime(d.created_at)}</time>
                    {d.mood && (
                      <span className="rounded-pill bg-accent/20 px-2.5 py-0.5 text-text/80">
                        心情：{d.mood}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    className="btn-ghost !px-3 !py-1.5 !text-xs"
                    onClick={() => openEdit(d)}
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    className="btn-ghost !px-3 !py-1.5 !text-xs !text-[#c0392b]"
                    onClick={() => setDeleteTarget(d)}
                  >
                    删除
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 新增 / 编辑 */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "编辑日记" : "写日记"}>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {saveError && (
            <div role="alert" className="rounded-card border border-[#c0392b]/30 bg-[#c0392b]/10 px-4 py-3 text-sm text-[#c0392b]">
              {saveError}
            </div>
          )}
          <div>
            <label htmlFor="diary-title" className="field-label">标题</label>
            <input id="diary-title" className="input" placeholder="今天发生了什么？" aria-invalid={!!errors.title} {...register("title")} />
            {errors.title && <p className="form-error" role="alert">{errors.title.message}</p>}
          </div>
          <div>
            <label htmlFor="diary-content" className="field-label">正文</label>
            <textarea
              id="diary-content"
              rows={6}
              className="input resize-y"
              placeholder="记录此刻的想法…"
              {...register("content")}
            />
            {errors.content && <p className="form-error" role="alert">{errors.content.message}</p>}
          </div>
          <div>
            <label htmlFor="diary-mood" className="field-label">心情（可选）</label>
            <select id="diary-mood" className="input" {...register("mood")}>
              <option value="">不标记</option>
              {MOODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>取消</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <Spinner className="h-4 w-4" /> : editing ? "保存修改" : "发布"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        message={`确定删除日记「${deleteTarget?.title ?? ""}」吗？此操作不可恢复。`}
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
