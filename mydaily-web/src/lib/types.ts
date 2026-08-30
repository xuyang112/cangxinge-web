/** 与后端 mydaily-api 对齐的共享类型（Pydantic schemas 的 TS 镜像） */

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiEnvelope<T> {
  data: T | null;
  error: ApiErrorBody | null;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface User {
  id: string;
  email: string;
  display_name: string;
  plan: string;
  subscription_status: string;
  created_at: string;
}

export interface Diary {
  id: string;
  title: string;
  content: string;
  mood: string | null;
  created_at: string;
  updated_at: string;
}

export type StudyItemType = "书" | "课程" | "文章" | "视频";

export interface StudyItem {
  id: string;
  title: string;
  type: StudyItemType;
  note: string | null;
  progress: number;
  created_at: string;
}

export interface LifePost {
  id: string;
  text: string;
  images: string[];
  created_at: string;
}

export interface PresignResult {
  mode: "r2" | "local";
  key: string;
  upload_url: string | null;
  public_url: string;
  expires_in: number | null;
}

export const STUDY_ITEM_TYPES: StudyItemType[] = ["书", "课程", "文章", "视频"];

export const MOODS = ["开心", "平静", "感动", "疲惫", "焦虑", "兴奋", "难过", "期待"];

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
