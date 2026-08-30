"use client";

import { useEffect, useRef, useState } from "react";

export interface PickedImage {
  file: File;
  preview: string;
}

/** 多图选择 + 本地预览（上传动作由调用方执行） */
export default function ImageUploader({
  images,
  onChange,
  max = 9,
}: {
  images: PickedImage[];
  onChange: (images: PickedImage[]) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // 清理 objectURL，防止内存泄漏
  useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const room = max - images.length;
    const picked = list.slice(0, Math.max(0, room)).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    if (picked.length > 0) onChange([...images, ...picked]);
  };

  const remove = (index: number) => {
    URL.revokeObjectURL(images[index].preview);
    onChange(images.filter((_, i) => i !== index));
  };

  if (images.length >= max) return null;

  return (
    <div>
      {images.length > 0 && (
        <ul className="mb-3 grid grid-cols-3 gap-2" aria-label="已选图片预览">
          {images.map((img, i) => (
            <li key={img.preview} className="group relative aspect-square overflow-hidden rounded-card bg-black/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.preview} alt={`预览图 ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`移除第 ${i + 1} 张图片`}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-pill bg-black/55 text-xs text-white transition-opacity hover:bg-black/75"
              >
                ✕
              </button>
              <span className="absolute bottom-1 left-1 rounded-pill bg-black/45 px-1.5 text-[10px] text-white">
                {i + 1}/{images.length}
              </span>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
        }}
        className={`flex w-full items-center justify-center gap-2 rounded-card border-2 border-dashed px-4 py-6 text-sm text-muted transition-colors ${
          dragOver ? "border-accent bg-accent/10" : "border-black/10 hover:border-accent/60"
        }`}
      >
        <span aria-hidden="true">🖼️</span> 添加图片（最多 {max} 张，支持拖拽）
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
          e.target.value = "";
        }}
        aria-label="选择图片"
      />
    </div>
  );
}
