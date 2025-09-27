const API = "https://v2.api.noroff.dev/social";

function authHeaders() {
  const auth = JSON.parse(localStorage.getItem("auth") || "{}");
  const token = auth?.token;
  const apiKey = auth["X-Noroff-API-Key"]; 

  if (!token || !apiKey) {
    console.error("Missing authentication token or API key.");
    throw new Error("Authentication required.");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "X-Noroff-API-Key": apiKey,
  };
}

async function authFetch(url, options = {}) {
  try {
    const headers = authHeaders();
    const res = await fetch(url, { ...options, headers });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      console.error("API Error:", res.status, res.statusText, errorBody);
      throw new Error(errorBody?.errors?.[0]?.message || res.statusText || "Request failed");
    }

    return await res.json();
  } catch (error) {
    console.error("Failed to fetch:", error.message);
    throw error;
  }
}

export async function getProfile(name, { include = [] } = {}) {
  const params = new URLSearchParams();
  include.forEach((key) => params.append(key, "true"));
  const url = `${API}/profiles/${encodeURIComponent(name)}?${params.toString()}`;
  return authFetch(url);
}

export async function followProfile(name) {
  const url = `${API}/profiles/${encodeURIComponent(name)}/follow`;
  return authFetch(url, { method: "PUT" });
}

export async function unfollowProfile(name) {
  const url = `${API}/profiles/${encodeURIComponent(name)}/unfollow`;
  return authFetch(url, { method: "PUT" });
}

export async function updateProfile(avatar) {
  if (!avatar || typeof avatar !== "object" || !avatar.url) {
    throw new Error("Invalid avatar object. Expected an object with a 'url' property.");
  }

  const auth = JSON.parse(localStorage.getItem("auth") || "{}");
  const username = auth?.user?.name;

  if (!username) {
    throw new Error("Username is missing. Please log in again.");
  }

  const url = `${API}/profiles/${encodeURIComponent(username)}`;
  return authFetch(url, {
    method: "PUT",
    body: JSON.stringify({ avatar }), 
  });
}