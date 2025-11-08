import { qs, el } from "../../core/dom.js";
import { getAuth } from "../../api/auth.js";
import { flash } from "../../ui/flash.js";
import {
  getPostsAll,
  getPostsFollowing,
  searchPosts,
  reactToPost,
} from "../../api/posts.js";

const postsPerPage = 15;
let currentPage = 1;
let totalPages = 1;
let currentQuery = "";
let currentFeed = "general";

function reactedKey() {
  const me = getAuth()?.user?.name || "anon";
  return `reacted:${me}`;
}
function getReactedSet() {
  try {
    return new Set(JSON.parse(localStorage.getItem(reactedKey()) || "[]"));
  } catch {
    return new Set();
  }
}
function saveReactedSet(s) {
  localStorage.setItem(reactedKey(), JSON.stringify(Array.from(s)));
}
function isReactedLocal(postId) {
  return getReactedSet().has(String(postId));
}
function setReactedLocal(postId, on) {
  const s = getReactedSet();
  const id = String(postId);
  if (on) s.add(id);
  else s.delete(id);
  saveReactedSet(s);
}

async function fetchPosts(page = 1) {
  try {
    let res;
    if (currentFeed === "general") {
      res = currentQuery
        ? await searchPosts({ query: currentQuery, limit: postsPerPage, page })
        : await getPostsAll({ limit: postsPerPage, page });
    } else {
      res = await getPostsFollowing({ limit: postsPerPage, page });
    }

    if (!res || !res.data) throw new Error("Failed to fetch posts");

    currentPage = page;
    let posts = res.data;

    if (currentFeed === "following" && currentQuery) {
      const q = currentQuery.toLowerCase();
      posts = posts.filter(
        (p) =>
          (p.title || "").toLowerCase().includes(q) ||
          (p.body || "").toLowerCase().includes(q)
      );
      totalPages = res.meta?.pageCount || 1;
    } else {
      totalPages = res.meta?.pageCount || 1;
    }

    displayPosts(posts);
    renderPagination(currentPage);

    window.scrollTo({ top: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  } catch (error) {
    console.error("Error fetching posts:", error);
    flash("Failed to load posts. Please try again later.", "error");
  }
}

function displayPosts(posts) {
  const container = qs("#feed-list");
  if (!container) return;
  container.innerHTML = "";

  if (!posts.length) {
    container.innerHTML = "<p>No posts found.</p>";
    return;
  }

  posts.forEach((post) => {
    const postElement = postCard(post);
    container.appendChild(postElement);
  });
}

function styleHeart(btn, active) {
  if (!btn) return;
  if (active) {
    btn.className = "btn-custom";
  } else {
    btn.className = "";
    btn.style.backgroundColor = "transparent";
    btn.style.color = "inherit";
  }
}

function postCard(post) {
  const card = el("article", { className: "card" });
  const title = post.title || "Untitled";
  const author = post.author?.name || "Unknown";
  const body = post.body || "";
  const media = post.media?.url
    ? `<img alt="${post.media.alt || ""}" src="${
        post.media.url
      }" class="img-fluid rounded"/>`
    : "";
  const commentsCount = post._count?.comments || 0;
  const reactionsCount = post._count?.reactions || 0;
  const reacted = isReactedLocal(post.id);

  card.innerHTML = `
    <header class="d-flex justify-content-between align-items-center">
      <h3 class="mb-0 post-title">${title}</h3>
      <small class="text-muted">
        <a href="#/profile/${encodeURIComponent(
          author
        )}" data-link class="text-decoration-none author-link">by ${author}</a>
      </small>
    </header>
    <div class="mt-3">${body}</div>
    <div class="mt-3">${media}</div>
    <footer class="d-flex justify-content-between align-items-center mt-3">
      <div class="d-flex gap-3">
        <span class="text-muted">💬 ${commentsCount}</span>
        <button class="reaction-btn btn p-0 border-0 bg-transparent" data-post-id="${
          post.id
        }" type="button">
          ❤️ <span class="reaction-count">${reactionsCount}</span>
        </button>
      </div>
      <span class="text-muted">${new Date(post.created).toLocaleString()}</span>
    </footer>
  `;

  const profileLink = card.querySelector("a[data-link]");
  if (profileLink) {
    profileLink.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }

  const heartBtn = card.querySelector(".reaction-btn");
  styleHeart(heartBtn, reacted);

  if (heartBtn) {
    heartBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const pid = heartBtn.getAttribute("data-post-id");
      const countEl = heartBtn.querySelector(".reaction-count");
      const wasOn = isReactedLocal(pid);
      try {
        await reactToPost(pid, "❤️");
        setReactedLocal(pid, !wasOn);
        styleHeart(heartBtn, !wasOn);
        const num = parseInt(countEl.textContent || "0", 10);
        const next = wasOn ? Math.max(0, num - 1) : num + 1;
        countEl.textContent = String(next);
      } catch {
        flash("Failed to react", "error");
      } finally {
        fetchPosts(currentPage);
      }
    });
  }

  card.addEventListener("click", () => {
    location.hash = `#/post/${post.id}`;
  });

  return card;
}

function renderPagination(page) {
  let paginationContainer = qs("#pagination-container");
  if (!paginationContainer) {
    paginationContainer = el("div", { id: "pagination-container" });
    qs("#feed-list")?.after(paginationContainer);
  }

  paginationContainer.innerHTML = "";

  const startPage = Math.max(1, page - 2);
  const endPage = Math.min(totalPages, startPage + 4);

  const prevButton = el("button", {
    className: "btn",
    innerHTML: "← Previous",
    disabled: page === 1,
    type: "button",
  });
  prevButton.addEventListener("click", () => fetchPosts(page - 1));
  paginationContainer.appendChild(prevButton);

  for (let i = startPage; i <= endPage; i++) {
    const pageButton = el("button", {
      className: i === page ? "btn btn-primary" : "btn btn-outline-secondary",
      innerHTML: i,
      type: "button",
    });
    if (i === page) {
      pageButton.setAttribute("aria-current", "page");
    }
    pageButton.addEventListener("click", () => fetchPosts(i));
    paginationContainer.appendChild(pageButton);
  }

  const nextButton = el("button", {
    className: "btn",
    innerHTML: "Next →",
    disabled: page === totalPages,
    type: "button",
  });
  nextButton.addEventListener("click", () => fetchPosts(page + 1));
  paginationContainer.appendChild(nextButton);
}

export async function renderFeed() {
  if (!getAuth()?.token) {
    location.hash = "#/login";
    return;
  }

  const app = qs("#app");
  const res = await fetch("/src/pages/feed/view.html");
  if (!res.ok) {
    flash("Failed to load feed view", "error");
    return;
  }
  app.innerHTML = await res.text();

  if (!qs("#pagination-container")) {
    const paginationContainer = el("div", { id: "pagination-container" });
    qs("#feed-list")?.after(paginationContainer);
  }

  const feedSelect = qs("#feed-select");
  if (feedSelect) {
    currentFeed = feedSelect.value;
    feedSelect.addEventListener("change", () => {
      currentFeed = feedSelect.value;
      fetchPosts(1);
    });
  }

  const input = qs("#search-input");
  const form = qs("#search-form");
  if (input) input.value = currentQuery;

  if (form && input) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      currentQuery = input.value.trim();
      fetchPosts(1);
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        currentQuery = input.value.trim();
        fetchPosts(1);
      }
    });
  }

  fetchPosts(currentPage);
}
