/**
 * 统一 API 客户端：自动携带 cookie（credentials: 'include'）、
 * 解析后端统一响应结构 { data, error }、错误分类。
 */
import type { ApiEnvelope } from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000";

/** 后端接口统一前缀 /api/v1 */
const API_PREFIX = "/api/v1";

/** 拼接完整 URL：自动补 /api/v1 前缀，避免调用方重复写 */
function resolveUrl(path: string): string {
  return `${API_BASE}${path.startsWith(API_PREFIX) ? path : `${API_PREFIX}${path}`}`;
}

export class ApiError extends Error {
  status: number;
  code: string;
  details: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  formData?: FormData;
  signal?: AbortSignal;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
  retried = false,
): Promise<T> {
  const { method = "GET", body, headers, formData, signal } = options;

  const init: RequestInit = {
    method,
    credentials: "include", // 关键：httpOnly cookie
    signal,
    headers: headers ?? {},
  };

  if (formData) {
    init.body = formData;
  } else if (body !== undefined) {
    init.headers = { ...init.headers, "Content-Type": "application/json" };
    init.body = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(resolveUrl(path), init);
  } catch {
    throw new ApiError(0, "network_error", "网络错误：无法连接后端服务，请确认 mydaily-api 已启动");
  }

  // access token 过期 → 尝试用 refresh cookie 换新，再重试一次（登录/刷新接口除外）
  if (res.status === 401 && !retried && !path.startsWith("/auth/")) {
    try {
      await fetch(resolveUrl("/auth/refresh"), {
        method: "POST",
        credentials: "include",
      });
      return request<T>(path, options, true);
    } catch {
      /* 刷新失败，继续按原响应处理 */
    }
  }

  let envelope: ApiEnvelope<T> | null = null;
  try {
    envelope = (await res.json()) as ApiEnvelope<T>;
  } catch {
    // 非 JSON 响应
  }

  if (!res.ok || envelope?.error) {
    const err = envelope?.error;
    // FastAPI 的 404/错误返回 { detail: "..." }，作为兜底可读信息
    const fastapiDetail = (envelope as { detail?: unknown } | null)?.detail;
    throw new ApiError(
      res.status,
      err?.code ?? "http_error",
      err?.message ??
        (typeof fastapiDetail === "string" ? fastapiDetail : `请求失败（HTTP ${res.status}）`),
      err?.details,
    );
  }

  return envelope?.data as T;
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) =>
    request<T>(path, { signal }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<T>(path, { method: "POST", formData: fd });
  },
};
