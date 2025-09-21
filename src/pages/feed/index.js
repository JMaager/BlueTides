import { qs, el } from "../../core/dom.js";
import { listPosts } from "../../api/posts.js";
import { getAuth } from "../../api/auth.js";
import { spinner } from "../../ui/spinner.js";
import { flash } from "../../ui/flash.js";

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
      <span class="muted">💬 ${commentsCount} Comments</span>
      <span class="muted">❤️ ${reactionsCount} Reactions</span>
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