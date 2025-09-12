import { api } from "./client.js";


export function listPosts({ limit = 20, offset = 0, query = "" } = {}) {
const q = query ? `&q=${encodeURIComponent(query)}` : "";
return api(`/social/posts?limit=${limit}&offset=${offset}&_author=true&_reactions=true${q}`, { auth: true });
}


export function createPost(payload) {
  // payload: { title?: string, body?: string, media?: { url?: string, alt?: string } }
  return api(`/social/posts`, { method: "POST", auth: true, body: JSON.stringify(payload) });
}