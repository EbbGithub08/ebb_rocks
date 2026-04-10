const base = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

/**
 * Fetch JSON from the API. In dev, Vite proxies `/api` to the Node server.
 */
export async function apiFetch(path, options = {}) {
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(options.headers);
  if (options.body != null && typeof options.body === "object" && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(url, {
    ...options,
    headers,
    body:
      options.body != null && typeof options.body === "object" && !(options.body instanceof FormData)
        ? JSON.stringify(options.body)
        : options.body,
  });
  return res;
}
