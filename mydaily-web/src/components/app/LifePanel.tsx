"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import ConfirmDialog from "@/components/app/ConfirmDialog";
import ImageUploader, { type PickedImage } from "@/components/app/ImageUploader";
import { EmptyState, ErrorBanner, LoadingBlock, Spinner } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { formatDateTime, type LifePost, type ListResponse, type PresignResult } from "@/lib/types";

const schema = z.object({
  text: z.string().min(1, "写点什么吧").max(5000, "最多 5000 字"),
});

type FormData = z.infer<typeof schema>;

/** 图片上传：R2 走预签名 PUT；未配置 R2 走后端本地 multipart 接口 */
async function uploadImages(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const contentType = file.type || "image/png";
    const presign = await api.post<PresignResult>("/uploads/presign", {
      filename: file.name,
      content_type: contentType,
    });
    if (presign.mode === "r2" && presign.upload_url) {
      const putRes = await fetch(presign.upload_url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": contentType },
      });
      if (!putRes.ok) throw new ApiError(putRes.status, "upload_failed", "图片上传失败（R2）");
      urls.push(presign.public_url);
    } else {
      const r = await api.upload<{ public_url: string }>("/uploads/local", file);
      urls.push(r.public_url);
    }
  }
  return urls;
}

export default function LifePanel() {
  const [posts, setPosts] = useState<LifePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [images, setImages] = useState<PickedImage[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LifePost | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<ListResponse<LifePost>>("/life-posts?limit=100");
      setPosts(data.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "加载失败，请重试");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onSubmit = handleSubmit(async (data) => {
    setPublishing(true);
    setPublishError(null);
    try {
      const imageUrls = await uploadImages(images.map((i) => i.file));
      await api.post("/life-posts", { text: data.text, images: imageUrls });
      reset({ text: "" });
      images.forEach((img) => URL.revokeObjectURL(img.preview));
      setImages([]);
      load();
    } catch (err) {
      setPublishError(err instanceof ApiError ? err.message : "发布失败，请重试");
    } finally {
      setPublishing(false);
    }
  });

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/life-posts/${deleteTarget.id}`);
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
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-text">生活动态</h1>
        <p className="mt-1 text-sm text-muted">分享此刻，留住生活的高光</p>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      {/* 发布框 */}
      <div className="card mb-8">
        <form onSubmit={onSubmit} noValidate>
          {publishError && (
            <div role="alert" className="mb-3 rounded-card border border-[#c0392b]/30 bg-[#c0392b]/10 px-4 py-3 text-sm text-[#c0392b]">
              {publishError}
            </div>
          )}
          <label htmlFor="life-text" className="sr-only">动态内容</label>
          <textarea
            id="life-text"
            rows={3}
            className="input resize-none !border-transparent !bg-transparent !shadow-none !px-0 focus:!ring-0"
            placeholder="分享此刻的想法…"
            aria-invalid={!!errors.text}
            {...register("text")}
          />
          {errors.text && <p className="form-error" role="alert">{errors.text.message}</p>}
          <div className="mt-2 border-t border-black/5 pt-3 dark:border-white/5">
            <ImageUploader images={images} onChange={setImages} />
            <div className="mt-3 flex justify-end">
              <button type="submit" className="btn-primary" disabled={publishing || isSubmitting}>
                {publishing ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="h-4 w-4" /> 发布中…
                  </span>
                ) : (
                  "发布"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 动态流 */}
      {loading ? (
        <LoadingBlock />
      ) : posts.length === 0 ? (
        <EmptyState icon="📷" title="还没有动态" desc="发布第一条动态，记录生活的瞬间" />
      ) : (
        <ul className="space-y-6">
          {posts.map((post) => (
            <li key={post.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-text">{post.text}</p>
                <button
                  type="button"
                  className="btn-ghost shrink-0 !px-3 !py-1.5 !text-xs !text-[#c0392b]"
                  onClick={() => setDeleteTarget(post)}
                >
                  删除
                </button>
              </div>
              {post.images.length > 0 && (
                <div className={`mt-3 grid gap-2 ${post.images.length === 1 ? "grid-cols-1" : post.images.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                  {post.images.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={`${src}-${i}`}
                      src={src}
                      alt={`动态图片 ${i + 1}`}
                      loading="lazy"
                      className="aspect-square w-full rounded-card bg-black/5 object-cover"
                    />
                  ))}
                </div>
              )}
              <time className="mt-3 block text-xs text-muted" dateTime={post.created_at}>
                {formatDateTime(post.created_at)}
              </time>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        message="确定删除这条动态吗？此操作不可恢复。"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
