import { api } from "./client.js";

export function listPosts({ limit = 20, offset = 0, query = "" } = {}) {
const q = query ? `&q=${encodeURIComponent(query)}` : "";
return api(`/social/posts?limit=${limit}&offset=${offset}&_author=true&_reactions=true${q}`, { auth: true });
}


export function createPost(payload) {
  return api(`/social/posts`, { method: "POST", auth: true, body: JSON.stringify(payload) });
}

export async function getPost(postId) {
  return api(`/social/posts/${postId}?_author=true&_comments=true&_reactions=true`, { auth: true });
}

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

export async function getPostsAll({ limit = 25, offset = 0 } = {}) {
  const p = new URLSearchParams({
    limit, offset, _author: "true", _comments: "true", _reactions: "true",
  });
  return authFetch(`${API}/posts?${p.toString()}`);
}

export async function getPostsFollowing({ limit = 25, offset = 0 } = {}) {
  const p = new URLSearchParams({
    limit, offset, _author: "true", _comments: "true", _reactions: "true",
  });
  return authFetch(`${API}/posts/following?${p.toString()}`); 
}

export async function getPostsByUser(name, { limit = 25, offset = 0 } = {}) {
  const p = new URLSearchParams({
    limit, offset, _author: "true", _comments: "true", _reactions: "true",
  });
  return authFetch(`${API}/profiles/${encodeURIComponent(name)}/posts?${p}`);
}