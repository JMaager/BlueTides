const API = "https://api.noroff.dev/api/v1/social";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function authFetch(url, options = {}) {
  const res = await fetch(url, { ...options, headers: authHeaders() });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export async function getProfile(name, {
  include = ["_followers", "_following", "_posts"],
} = {}) {
  const p = new URLSearchParams();
  include.forEach(k => p.set(k, "true"));
  return authFetch(`${API}/profiles/${encodeURIComponent(name)}?${p}`);
}

export async function followProfile(name) {
  return authFetch(`${API}/profiles/${encodeURIComponent(name)}/follow`, { method: "PUT" });
}

export async function unfollowProfile(name) {
  return authFetch(`${API}/profiles/${encodeURIComponent(name)}/unfollow`, { method: "PUT" });
}
