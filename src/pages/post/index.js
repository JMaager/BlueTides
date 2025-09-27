import { qs } from "../../core/dom.js";
import { getPost, updatePost, deletePost, reactToPost, commentOnPost } from "../../api/posts.js";
import { getAuth } from "../../api/auth.js";
import { flash } from "../../ui/flash.js";

let renderTicket = 0;

function reactedKey() {
  const me = getAuth()?.user?.name || "anon";
  return `reacted:${me}`;
}
function getReactedSet() {
  try { return new Set(JSON.parse(localStorage.getItem(reactedKey()) || "[]")); }
  catch { return new Set(); }
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
  if (on) s.add(id); else s.delete(id);
  saveReactedSet(s);
}
function styleHeart(btn, active) {
  if (!btn) return;
  if (active) {
    btn.style.backgroundColor = "#246B84";
    btn.style.color = "white";
    btn.style.borderRadius = "6px";
    btn.style.padding = ".2rem .5rem";
  } else {
    btn.style.backgroundColor = "transparent";
    btn.style.color = "inherit";
  }
}

export async function renderPost(postId) {
  if (!postId) {
    flash("Post ID is missing!", "error");
    location.hash = "#/feed";
    return;
  }

  const ticket = ++renderTicket;

  try {
    const app = qs("#app");
    const res = await fetch("/src/pages/post/view.html");
    app.innerHTML = await res.text();

    const post = await getPost(postId);
    const postData = post?.data ?? post;

    if (ticket !== renderTicket) return;

    if (!postData || !postData.id) {
      flash("Post not found.", "error");
      location.hash = "#/feed";
      return;
    }

    qs("#post-title").textContent = postData.title || "Untitled";
    qs("#post-author").textContent = `by ${postData.author?.name || "Unknown"}`;
    qs("#post-body").textContent = postData.body || "";
    qs("#post-media").innerHTML = postData.media?.url
      ? `<img alt="${postData.media.alt || ''}" src="${postData.media.url}" style="max-width:100%;border-radius:8px;"/>`
      : "";
    qs("#post-comments-count").textContent = `💬 ${postData._count?.comments || 0}`;
    qs("#post-reactions-count").textContent = `${postData._count?.reactions || 0}`;

    const commentsList = qs("#comments-list");
    commentsList.innerHTML = "";
    if (postData.comments?.length) {
      const frag = document.createDocumentFragment();
      for (const comment of postData.comments) {
        const commentEl = document.createElement("div");
        commentEl.className = "card";
        commentEl.innerHTML = `
          <p><strong>${comment.owner?.name || "Anonymous"}</strong></p>
          <p>${comment.body}</p>
          <small class="muted">${new Date(comment.created).toLocaleString()}</small>
        `;
        frag.append(commentEl);
      }
      commentsList.append(frag);
    } else {
      commentsList.innerHTML = "<p class='muted'>No comments yet.</p>";
    }

    const reactBtn = qs("#post-reaction-btn");
    styleHeart(reactBtn, isReactedLocal(postData.id));
    if (reactBtn) {
      reactBtn.addEventListener("click", async () => {
        const wasOn = isReactedLocal(postData.id);
        try {
          await reactToPost(postData.id, "❤️");
          setReactedLocal(postData.id, !wasOn);
          styleHeart(reactBtn, !wasOn);
          const fresh = await getPost(postData.id);
          const freshData = fresh?.data ?? fresh;
          qs("#post-reactions-count").textContent = `${freshData._count?.reactions || 0}`;
        } catch (e) {
          flash(e.message || "Failed to react", "error");
        }
      });
    }

    const commentForm = qs("#comment-form");
    const commentInput = qs("#comment-input");
    const commentSubmit = qs("#comment-submit");
    const commentErr = qs("#comment-error");

    if (commentForm && commentInput && commentSubmit) {
      commentForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const body = commentInput.value.trim();
        if (!body) return;
        commentErr.hidden = true;
        commentSubmit.disabled = true;
        commentSubmit.textContent = "Posting…";
        try {
          await commentOnPost(postData.id, body);
          commentInput.value = "";
          await renderPost(postData.id);
        } catch (e2) {
          commentErr.textContent = e2.message || "Failed to post comment";
          commentErr.hidden = false;
        } finally {
          commentSubmit.disabled = false;
          commentSubmit.textContent = "Post comment";
        }
      });
    }

    const me = getAuth()?.user?.name || null;
    const isOwner = me && postData.author?.name === me;

    const editBtn = qs("#edit-btn");
    const editForm = qs("#edit-form");
    const titleInput = qs("input[name='title']");
    const bodyInput = qs("textarea[name='body']");
    const mediaUrlInput = qs("input[name='mediaUrl']");
    const mediaAltInput = qs("input[name='mediaAlt']");
    const saveBtn = qs("#save-btn");
    const cancelBtn = qs("#cancel-edit-btn");
    const deleteBtn = qs("#delete-btn");
    const errEl = qs("#edit-error");

    if (deleteBtn) deleteBtn.type = "button";

    if (isOwner) {
      editBtn.style.display = "inline-block";

      editBtn.addEventListener("click", () => {
        titleInput.value = postData.title || "";
        bodyInput.value = postData.body || "";
        mediaUrlInput.value = postData.media?.url || "";
        mediaAltInput.value = postData.media?.alt || "";
        editForm.style.display = "block";
        editBtn.style.display = "none";
        deleteBtn.style.display = "inline-block";

        deleteBtn.onclick = async () => {
          const ok = confirm("Delete this post? This cannot be undone.");
          if (!ok) return;
          deleteBtn.disabled = true;
          deleteBtn.textContent = "Deleting...";
          try {
            await deletePost(postData.id);
            flash("Post deleted", "success");
            location.hash = "#/feed";
          } catch (e3) {
            deleteBtn.disabled = false;
            deleteBtn.textContent = "Delete";
            errEl.textContent = e3.message || "Failed to delete post";
            errEl.hidden = false;
          }
        };
      });

      editForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        errEl.hidden = true;
        errEl.textContent = "";
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving...";
        try {
          const payload = {};
          const t = titleInput.value.trim();
          const b = bodyInput.value.trim();
          const mu = mediaUrlInput.value.trim();
          const ma = mediaAltInput.value.trim();
          if (t) payload.title = t;
          payload.body = b;
          if (mu) payload.media = { url: mu, ...(ma && { alt: ma }) };
          const updated = await updatePost(postData.id, payload);
          flash("Post updated", "success");
          renderPost(updated?.data?.id ?? postData.id);
        } catch (e2) {
          errEl.textContent = e2.message || "Failed to update post";
          errEl.hidden = false;
          saveBtn.disabled = false;
          saveBtn.textContent = "Save";
        }
      });

      cancelBtn.addEventListener("click", () => {
        editForm.reset();
        editForm.style.display = "none";
        editBtn.style.display = "inline-block";
        deleteBtn.style.display = "none";
      });
    } else {
      editBtn.style.display = "none";
      editForm.style.display = "none";
      deleteBtn.style.display = "none";
    }

    qs("#back-btn")?.addEventListener("click", (e) => {
      e.preventDefault();
      history.back();
    }, { once: true });
  } catch (e) {
    flash(e.message || "Failed to load post", "error");
    location.hash = "#/feed";
  }
}
