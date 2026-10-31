export const API_BASE =
  typeof window === "undefined"
    ? "http://localhost:3001"
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";

export function authHeaders(user) {
  const headers = { "Content-Type": "application/json" };
  if (user?.id) headers["x-user-id"] = String(user.id);
  return headers;
}

export async function api(path, { method = "GET", body, user } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: authHeaders(user),
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
