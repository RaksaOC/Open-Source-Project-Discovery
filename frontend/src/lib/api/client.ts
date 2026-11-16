/* Thin fetch wrapper over the FastAPI backend (proxied at /api by next.config.ts). */
import type { Health, Method, Methods, SearchResponse } from "./types";

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: unknown,
  ) {
    super(`API ${status}`);
  }

  /** 501 = the route exists but the pipeline behind it is still a stub. */
  get notImplemented() {
    return this.status === 501;
  }
}

async function get<T>(path: string, params?: Record<string, string | number | boolean>): Promise<T> {
  const qs = params ? `?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))}` : "";
  const res = await fetch(`/api${path}${qs}`, { cache: "no-store" });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, body);
  return body as T;
}

export const api = {
  health: () => get<Health>("/health"),
  methods: () => get<Methods>("/methods"),
  search: (q: string, opts: { method?: Method; k?: number; popularity?: boolean } = {}) =>
    get<SearchResponse>("/search", { q, method: opts.method ?? "bm25", k: opts.k ?? 10, popularity: opts.popularity ?? true }),
};
