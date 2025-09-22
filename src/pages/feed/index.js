import { qs, el, qsa } from "../../core/dom.js";
import { listPosts } from "../../api/posts.js";
import { getAuth } from "../../api/auth.js";
import { spinner } from "../../ui/spinner.js";
import { flash } from "../../ui/flash.js";
import { getPostsAll, getPostsFollowing, getPostsByUser } from "../../api/posts.js";

function postCard(p) {
  const card = el("article", { className: "card" });
  const title = p.title || "Untitled";
  const author = p.author?.name || "Unknown";
  const body = p.body || "";
  const media = p.media?.url ? `<img alt="${p.media.alt || ''}" src="${p.media.url}" style="max-width:100%;border-radius:8px;"/>` : "";
  const commentsCount = p._count?.comments || 0;
  const reactionsCount = p._count?.reactions || 0;

  card.innerHTML = `
    <header style="display:flex;justify-content:space-between;align-items:center;">
      <h3 style="margin:0;font-size:1.05rem;">${title}</h3>
      <small class="muted">by ${author}</small>
    </header>
    <div class="muted" style="margin:.25rem 0 .75rem 0;">${new Date(p.created).toLocaleString()}</div>
    <div>${body}</div>
    <div style="margin-top:.75rem;">${media}</div>
    <footer style="display:flex;justify-content:space-between;align-items:center;margin-top:1rem;">
      <span class="muted">💬 ${commentsCount}</span>
      <span class="muted">❤️ ${reactionsCount}</span>
    </footer>
  `;

card.addEventListener("click", () => {
    location.hash = `#/post/${p.id}`;
});

  return card;
}


let currentQuery = "";
let isLoading = false;


async function loadAndRender(container, { query = "" } = {}) {
  if (isLoading) return;
  isLoading = true;
  container.innerHTML = "";
  container.append(spinner("Loading posts…"));
  try {
    const res = await listPosts({ limit: 20, offset: 0, query });
    const items = res?.data || [];
    container.innerHTML = "";
    if (!items.length) {
      container.append(el("div", { className: "card", innerHTML: "No posts found." }));
      return;
    }
    items.forEach((p) => container.append(postCard(p)));
  } catch (e) {
    container.innerHTML = "";
    flash(e.message || "Failed to load posts", "error");
    container.append(el("div", { className: "card", innerHTML: `Error: ${e.message}` }));
  } finally {
    isLoading = false;
  }
}


export function renderFeed() {
if (!getAuth()?.token) { location.hash = "#/login"; return; }


fetch("./src/pages/feed/view.html").then(r => r.text()).then((html) => {
const app = qs("#app");
app.innerHTML = html;


const list = qs("#feed-list");
const input = qs("#search-input");


loadAndRender(list, { query: currentQuery });


let t;
input.addEventListener("input", () => {
currentQuery = input.value.trim();
clearTimeout(t);
t = setTimeout(() => loadAndRender(list, { query: currentQuery }), 300);
});
});
}


function activeUserName() {
  try { return JSON.parse(localStorage.getItem("profile"))?.name; }
  catch { return null; }
}

function card(post) {
  const author = post.author?.name || "Unknown";
  const media = post.media ? `<img src="${post.media}" alt="" style="max-width:100%;border-radius:8px" />` : "";
  return `
    <article class="card">
      <header class="row gap">
        <a href="#/u/${encodeURIComponent(author)}" data-link class="muted">@${author}</a>
        <span class="muted" style="margin-left:auto">${new Date(post.created).toLocaleString()}</span>
      </header>
      <h3>${post.title ?? "Untitled"}</h3>
      <p>${post.body ?? ""}</p>
      ${media}
      <footer class="muted">❤️ ${post._count?.reactions ?? 0} · 💬 ${post._count?.comments ?? 0}</footer>
    </article>
  `;
}

async function loadFeed(mode, listEl) {
  listEl.innerHTML = `<p class="muted">Loading…</p>`;
  let posts = [];
  if (mode === "general") posts = await getPostsAll({ limit: 50 });
  if (mode === "following") posts = await getPostsFollowing({ limit: 50 });
  if (mode === "personal") {
    const me = activeUserName();
    if (!me) return (listEl.innerHTML = `<p class="muted">Log in to see your posts.</p>`);
    posts = await getPostsByUser(me, { limit: 50 });
  }
  listEl.innerHTML = posts.map(card).join("");
}

export async function renderFeed() {
  const app = qs("#app");
  const res = await fetch("/src/pages/feed/view.html");
  app.innerHTML = await res.text();

  const listEl = qs("#feed-list");
  const tabs = qsa("#feed-tabs [data-feed]");

  const urlTab = new URLSearchParams(location.hash.split("?")[1]).get("tab");
  const initial = urlTab || "general";

  tabs.forEach(btn => {
    btn.classList.toggle("is-active", btn.dataset.feed === initial);
    btn.addEventListener("click", () => {
      tabs.forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      history.replaceState({}, "", `#/feed?tab=${btn.dataset.feed}`);
      loadFeed(btn.dataset.feed, listEl);
    });
  });

  await loadFeed(initial, listEl);
}