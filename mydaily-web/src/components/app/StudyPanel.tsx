"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import ConfirmDialog from "@/components/app/ConfirmDialog";
import Modal from "@/components/Modal";
import { EmptyState, ErrorBanner, LoadingBlock, Spinner } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import {
  formatDate,
  STUDY_ITEM_TYPES,
  type ListResponse,
  type StudyItem,
  type StudyItemType,
} from "@/lib/types";

const schema = z.object({
  title: z.string().min(1, "请输入标题").max(255, "标题最长 255 字"),
  type: z.enum(STUDY_ITEM_TYPES as [StudyItemType, ...StudyItemType[]]),
  note: z.string().max(10000, "笔记过长").optional(),
  progress: z.coerce.number().min(0).max(100),
});

type FormData = z.infer<typeof schema>;

const FILTERS: Array<"全部" | StudyItemType> = ["全部", ...STUDY_ITEM_TYPES];

const TYPE_STYLE: Record<StudyItemType, string> = {
  书: "bg-primary/25 text-text",
  课程: "bg-accent/25 text-text",
  文章: "bg-[#d9c7b8]/40 text-text",
  视频: "bg-[#c7d3dd]/40 text-text",
};

export default function StudyPanel() {
  const [items, setItems] = useState<StudyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("全部");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StudyItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudyItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", type: "书", note: "", progress: 0 },
  });

  const progressValue = watch("progress");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<ListResponse<StudyItem>>("/study-items?limit=100");
      setItems(data.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "加载失败，请重试");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () => (filter === "全部" ? items : items.filter((i) => i.type === filter)),
    [items, filter],
  );

  const openCreate = () => {
    setEditing(null);
    reset({ title: "", type: "书", note: "", progress: 0 });
    setSaveError(null);
    setModalOpen(true);
  };

  const openEdit = (item: StudyItem) => {
    setEditing(item);
    reset({ title: item.title, type: item.type, note: item.note ?? "", progress: item.progress });
    setSaveError(null);
    setModalOpen(true);
  };

  const onSubmit = handleSubmit(async (data) => {
    setSaving(true);
    setSaveError(null);
    try {
      const payload = { title: data.title, type: data.type, note: data.note || null, progress: data.progress };
      if (editing) {
        await api.put(`/study-items/${editing.id}`, payload);
      } else {
        await api.post("/study-items", payload);
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
      await api.delete(`/study-items/${deleteTarget.id}`);
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
          <h1 className="font-serif text-2xl font-bold text-text">学习资料</h1>
          <p className="mt-1 text-sm text-muted">共 {items.length} 项，按创建时间倒序</p>
        </div>
        <button type="button" className="btn-primary" onClick={openCreate}>
          ＋ 添加资料
        </button>
      </div>

      {/* 类型筛选 */}
      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="按类型筛选">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`rounded-pill px-4 py-1.5 text-sm transition-colors ${
              filter === f
                ? "bg-text text-bg"
                : "bg-surface text-muted hover:text-text"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      {loading ? (
        <LoadingBlock />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="📚"
          title={filter === "全部" ? "还没有学习资料" : `暂无「${filter}」类资料`}
          desc="记录在读的书、在学的课程，用进度跟踪积累"
          action={
            filter === "全部" ? (
              <button type="button" className="btn-primary" onClick={openCreate}>
                添加第一条
              </button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-4">
          {filtered.map((item) => (
            <li key={item.id} className="card transition-shadow hover:shadow-pop">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-pill px-2.5 py-0.5 text-xs ${TYPE_STYLE[item.type]}`}>
                      {item.type}
                    </span>
                    <h2 className="font-serif text-lg font-semibold text-text">{item.title}</h2>
                  </div>
                  {item.note && (
                    <p className="mt-1.5 text-sm leading-relaxed text-muted line-clamp-2">{item.note}</p>
                  )}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-pill bg-black/10 dark:bg-white/10" role="progressbar" aria-valuenow={item.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${item.title} 进度`}>
                      <div
                        className="h-full rounded-pill bg-accent transition-all"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-xs font-medium text-muted">{item.progress}%</span>
                  </div>
                  <time className="mt-2 block text-xs text-muted" dateTime={item.created_at}>
                    添加于 {formatDate(item.created_at)}
                  </time>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" className="btn-ghost !px-3 !py-1.5 !text-xs" onClick={() => openEdit(item)}>
                    编辑
                  </button>
                  <button type="button" className="btn-ghost !px-3 !py-1.5 !text-xs !text-[#c0392b]" onClick={() => setDeleteTarget(item)}>
                    删除
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 新增 / 编辑 */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "编辑学习资料" : "添加学习资料"}>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          {saveError && (
            <div role="alert" className="rounded-card border border-[#c0392b]/30 bg-[#c0392b]/10 px-4 py-3 text-sm text-[#c0392b]">
              {saveError}
            </div>
          )}
          <div>
            <label htmlFor="study-title" className="field-label">标题</label>
            <input id="study-title" className="input" placeholder="书名 / 课程名 / 文章标题…" aria-invalid={!!errors.title} {...register("title")} />
            {errors.title && <p className="form-error" role="alert">{errors.title.message}</p>}
          </div>
          <div>
            <label htmlFor="study-type" className="field-label">类型</label>
            <select id="study-type" className="input" {...register("type")}>
              {STUDY_ITEM_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            {errors.type && <p className="form-error" role="alert">{errors.type.message}</p>}
          </div>
          <div>
            <label htmlFor="study-note" className="field-label">笔记（可选）</label>
            <textarea id="study-note" rows={4} className="input resize-y" placeholder="读后感、要点、链接…" {...register("note")} />
            {errors.note && <p className="form-error" role="alert">{errors.note.message}</p>}
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="study-progress" className="field-label !mb-0">进度</label>
              <span className="text-sm font-medium text-text">{Number(progressValue ?? 0)}%</span>
            </div>
            <input
              id="study-progress"
              type="range"
              min={0}
              max={100}
              step={5}
              className="w-full accent-[#a3b18a]"
              aria-valuetext={`${Number(progressValue ?? 0)}%`}
              {...register("progress")}
            />
            {errors.progress && <p className="form-error" role="alert">{errors.progress.message}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>取消</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <Spinner className="h-4 w-4" /> : editing ? "保存修改" : "添加"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        message={`确定删除「${deleteTarget?.title ?? ""}」吗？此操作不可恢复。`}
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
