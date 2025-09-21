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