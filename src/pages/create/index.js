import { qs } from "../../core/dom.js";
import { getAuth } from "../../api/auth.js";
import { createPost } from "../../api/posts.js";
import { flash } from "../../ui/flash.js";

export function renderCreatePost() {
  if (!getAuth()?.token) { location.hash = "#/login"; return; }

  fetch("/src/pages/create/view.html").then(r => r.text()).then(html => {
    const app = qs("#app");
    app.innerHTML = html;

    const form = qs("#create-form");
    const err = qs("#create-error");
    const backBtn = qs("#back-btn");

    backBtn.addEventListener("click", (e) => {
      e.preventDefault();
      history.back();
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      err.hidden = true; err.textContent = "";

      const fd = new FormData(form);
      const title = fd.get("title").toString().trim();
      const body = fd.get("body").toString().trim();
      const mediaUrl = fd.get("mediaUrl").toString().trim();
      const mediaAlt = fd.get("mediaAlt").toString().trim();

      const payload = { ...(title && { title }), body };
      if (mediaUrl) payload.media = { url: mediaUrl, ...(mediaAlt && { alt: mediaAlt }) };

      const btn = form.querySelector("button");
      btn.disabled = true; btn.textContent = "Publishing…";
      try {
        await createPost(payload);
        flash("Post published!", "success");
        location.hash = "#/feed";
      } catch (e) {
        err.textContent = e.message || "Failed to create post";
        err.hidden = false;
        flash(err.textContent, "error");
      } finally {
        btn.disabled = false; btn.textContent = "Publish";
      }
    });
  });
}