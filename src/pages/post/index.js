import { qs } from "../../core/dom.js";
import { getPost } from "../../api/posts.js";
import { flash } from "../../ui/flash.js";

export async function renderPost(postId) {
  if (!postId) {
    flash("Post ID is missing!", "error");
    location.hash = "#/feed";
    return;
  }

  try {
    const app = qs("#app");
    const res = await fetch("./src/pages/post/view.html");
    const html = await res.text();
    app.innerHTML = html;

    const post = await getPost(postId);
    console.log("Post data:", post);

    const postData = post.data;

    qs("#post-title").textContent = postData.title || "Untitled";
    qs("#post-author").textContent = `by ${postData.author?.name || "Unknown"}`;
    qs("#post-body").textContent = postData.body || "";
    qs("#post-media").innerHTML = postData.media?.url
      ? `<img alt="${postData.media.alt || ''}" src="${postData.media.url}" style="max-width:100%;border-radius:8px;"/>`
      : "";
    qs("#post-comments-count").textContent = `💬 ${postData._count?.comments || 0} Comments`;
    qs("#post-reactions-count").textContent = `❤️ ${postData._count?.reactions || 0} Reactions`;

    const commentsList = qs("#comments-list");
    if (postData.comments?.length) {
      postData.comments.forEach((comment) => {
        const commentEl = document.createElement("div");
        commentEl.className = "card";
        commentEl.innerHTML = `
          <p><strong>${comment.owner?.name || "Anonymous"}</strong></p>
          <p>${comment.body}</p>
          <small class="muted">${new Date(comment.created).toLocaleString()}</small>
        `;
        commentsList.append(commentEl);
      });
    } else {
      commentsList.innerHTML = "<p class='muted'>No comments yet.</p>";
    }

    const backBtn = qs("#back-btn");
    backBtn.addEventListener("click", (e) => {
      e.preventDefault();
      history.back(); 
    });
  } catch (e) {
    flash(e.message || "Failed to load post", "error");
    location.hash = "#/feed";
  }
}