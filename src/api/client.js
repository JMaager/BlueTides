const BASE_URL = "https://v2.api.noroff.dev";

export async function api(path, options = {}) {
  const { auth = false, headers = {}, body, ...rest } = options;
  const store = auth ? JSON.parse(localStorage.getItem("auth") || "{}") : {};
  const token = store?.token;
  const apiKey = store["X-Noroff-API-Key"];

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...(auth && apiKey ? { "X-Noroff-API-Key": apiKey } : {}),
      ...headers,
    },
    ...(body ? { body } : {}),
    ...rest,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.errors?.[0]?.message || res.statusText || "Request failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}