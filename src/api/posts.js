import { api } from "./client.js";

export function listPosts({ limit = 20, page = 1, offset = 0, query = "" } = {}) {
  if (!page && offset) page = Math.floor(offset / limit) + 1;
  const p = new URLSearchParams({
    limit,
    page,
    _author: "true",
    _reactions: "true",
    sort: "created",
    sortOrder: "desc",
  });
  if (query) p.set("q", query);
  return api(`/social/posts?${p.toString()}`, { auth: true });
}

export function createPost(payload) {
  return api(`/social/posts`, { method: "POST", auth: true, body: JSON.stringify(payload) });
}

export function getPost(postId) {
  return api(`/social/posts/${postId}?_author=true&_comments=true&_reactions=true`, { auth: true });
}

export function getPostsAll({ limit = 15, page = 1 } = {}) {
  const p = new URLSearchParams({
    limit,
    page,
    _author: "true",
    _comments: "true",
    _reactions: "true",
    sort: "created",
    sortOrder: "desc",
  });
  return api(`/social/posts?${p.toString()}`, { auth: true });
}

export function searchPosts({ query = "", limit = 15, page = 1 } = {}) {
  const p = new URLSearchParams({
    q: query,
    limit,
    page,
    _author: "true",
    _comments: "true",
    _reactions: "true",
    sort: "created",
    sortOrder: "desc",
  });
  return api(`/social/posts/search?${p.toString()}`, { auth: true });
}

export function getPostsFollowing({ limit = 15, page = 1 } = {}) {
  const p = new URLSearchParams({
    limit,
    page,
    _author: "true",
    _comments: "true",
    _reactions: "true",
    sort: "created",
    sortOrder: "desc",
  });
  return api(`/social/posts/following?${p.toString()}`, { auth: true });
}

export function getPostsByUser(name, { limit = 15, page = 1 } = {}) {
  const p = new URLSearchParams({
    limit, page, _author: "true", _comments: "true", _reactions: "true", sort: "created", sortOrder: "desc",
  });
  return api(`/social/profiles/${encodeURIComponent(name)}/posts?${p.toString()}`, { auth: true })
    .then(r => r.data);
}

export function updatePost(id, payload) {
  return api(`/social/posts/${id}`, { method: "PUT", auth: true, body: JSON.stringify(payload) });
}

export function deletePost(id) {
  return api(`/social/posts/${id}`, { method: "DELETE", auth: true });
}

export function reactToPost(id, symbol = "❤️") {
  return api(`/social/posts/${id}/react/${encodeURIComponent(symbol)}`, { method: "PUT", auth: true });
}

export function commentOnPost(id, body, replyToId) {
  const payload = replyToId ? { body, replyToId } : { body };
  return api(`/social/posts/${id}/comment`, { method: "POST", auth: true, body: JSON.stringify(payload) });
}
