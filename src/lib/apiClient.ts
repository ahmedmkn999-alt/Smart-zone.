function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; status: number };

export async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResult<T>> {
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  if (method !== "GET") {
    const csrf = readCookie("sz_csrf");
    if (csrf) headers.set("x-csrf-token", csrf);
  }

  const res = await fetch(url, { ...options, headers, credentials: "include" });
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    return { ok: false, error: body?.error || "حصل خطأ غير متوقع", status: res.status };
  }
  return { ok: true, data: body as T };
}
