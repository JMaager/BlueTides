import { qs, el } from "../../core/dom.js";
import { getProfile, followProfile, unfollowProfile, updateProfile } from "../../api/profiles.js";
import { getPostsByUser, reactToPost } from "../../api/posts.js";
import { flash } from "../../ui/flash.js";
import { getAuth } from "../../api/auth.js";

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
    btn.style.padding = ".15rem .4rem";
  } else {
    btn.style.backgroundColor = "transparent";
    btn.style.color = "inherit";
  }
}

function showOverlay(title, itemsHtml) {
  const overlay = el("div", { className: "overlay", style: "position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:9999;" });
  const box = el("div", { className: "card", style: "max-width:480px;width:90%;max-height:80vh;overflow:auto;padding:1rem;" });
  box.innerHTML = `
    <header class="row" style="justify-content:space-between;align-items:center;margin-bottom:.5rem;">
      <h3 style="margin:0;">${title}</h3>
      <button id="overlay-close" class="btn" type="button">Close</button>
    </header>
    ${itemsHtml}
  `;
  overlay.append(box);
  document.body.append(overlay);
  qs("#overlay-close", overlay).addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
}

function renderUserList(title, users) {
  if (!Array.isArray(users) || users.length === 0) {
    showOverlay(title, `<p class="muted">No users found.</p>`);
    return;
  }
  const list = users.map(u => `
    <li class="row gap" style="align-items:center;">
      <img src="${u.avatar?.url || "https://placehold.co/32x32"}" alt="${u.avatar?.alt || u.name}" style="width:32px;height:32px;border-radius:50%;">
      <a href="#/profile/${encodeURIComponent(u.name)}" data-link>@${u.name}</a>
    </li>
  `).join("");
  showOverlay(title, `<ul class="stack" style="gap:.5rem;">${list}</ul>`);
}

function postCard(p) {
  const card = el("article", { className: "card" });
  const title = p.title ?? "Untitled";
  const body = p.body ?? "";
  const media = p.media?.url ? `<img src="${p.media.url}" alt="${p.media.alt || ''}" style="max-width:100%;border-radius:8px;">` : "";
  const commentsCount = p._count?.comments ?? 0;
  const reactionsCount = p._count?.reactions ?? 0;
  const reacted = isReactedLocal(p.id);

  card.innerHTML = `
    <h4 style="margin:0 0 .25rem 0;">${title}</h4>
    <div class="muted" style="margin:.25rem 0 .75rem 0;">${new Date(p.created).toLocaleString()}</div>
    <p>${body}</p>
    ${media}
    <footer class="row" style="justify-content:space-between;align-items:center;margin-top:1rem;">
      <span class="muted">💬 ${commentsCount}</span>
      <button class="reaction-btn" data-post-id="${p.id}" type="button" style="background:none;border:none;cursor:pointer;padding:0;">
        ❤️ <span class="reaction-count">${reactionsCount}</span>
      </button>
    </footer>
  `;

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
      }
    });
  }

  card.addEventListener("click", () => {
    location.hash = `#/post/${p.id}`;
  });

  return card;
}

let renderTicket = 0;

export async function renderProfile(username) {
  if (!username || typeof username !== "string") {
    flash("Profile username is missing or invalid", "error");
    return;
  }

  const ticket = ++renderTicket;

  const app = qs("#app");
  const res = await fetch("/src/pages/profile/view.html");
  if (!res.ok) {
    flash("Failed to load profile view", "error");
    return;
  }
  app.innerHTML = await res.text();

  const nameEl = qs("#profile-name", app);
  const avatarEl = qs("#profile-avatar", app);
  const postsCountEl = qs("#profile-posts-count", app);
  const followersCountEl = qs("#profile-followers-count", app);
  const followingCountEl = qs("#profile-following-count", app);
  const postsEl = qs("#profile-posts", app);
  const followBtn = qs("#follow-btn", app);
  if (!nameEl || !avatarEl || !postsCountEl || !followersCountEl || !followingCountEl || !postsEl || !followBtn) {
    flash("Profile template missing required elements", "error");
    return;
  }

  let profRes, postsRes;
  try {
    [profRes, postsRes] = await Promise.all([
      getProfile(username, { include: ["_followers", "_following"] }),
      getPostsByUser(username, { limit: 50 }),
    ]);
  } catch (e) {
    flash(`Failed to load profile: ${e.message}`, "error");
    return;
  }

  if (ticket !== renderTicket) return;

  const profile = profRes?.data ?? profRes;
  const posts = Array.isArray(postsRes) ? postsRes : (postsRes?.data ?? []);

  nameEl.textContent = `@${profile.name || username}`;
  avatarEl.src = profile.avatar?.url || "https://placehold.co/128x128";
  avatarEl.alt = profile.avatar?.alt || profile.name || username;

  const followers = Array.isArray(profile.followers) ? profile.followers : [];
  const following = Array.isArray(profile.following) ? profile.following : [];
  const postsCount = profile._count?.posts ?? posts.length ?? 0;
  const followersCount = profile._count?.followers ?? followers.length ?? 0;
  const followingCount = profile._count?.following ?? following.length ?? 0;

  postsCountEl.textContent = `${postsCount} posts`;
  followersCountEl.textContent = `${followersCount} followers`;
  followingCountEl.textContent = `${followingCount} following`;

  followersCountEl.addEventListener("click", (e) => {
    e.preventDefault();
    renderUserList("Followers", followers);
  });
  followingCountEl.addEventListener("click", (e) => {
    e.preventDefault();
    renderUserList("Following", following);
  });

  postsEl.innerHTML = "";
  posts.forEach(p => postsEl.append(postCard(p)));

  const auth = getAuth();
  const isMe = auth?.user?.name === profile.name;

  if (isMe) {
    followBtn.style.display = "none";
    avatarEl.style.cursor = "pointer";
    avatarEl.title = "Click to change your profile picture";
    avatarEl.addEventListener("click", () => {
      const overlay = el("div", { className: "overlay", style: "position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:9999;" });
      overlay.innerHTML = `
        <div class="card" style="max-width:480px;width:90%;padding:1rem;">
          <h3>Update Profile Picture</h3>
          <input type="url" id="new-avatar-url" placeholder="Enter new avatar URL" class="input" style="margin:.5rem 0;">
          <input type="text" id="new-avatar-alt" placeholder="Enter image alt text (optional)" class="input" style="margin:.5rem 0;">
          <div class="row" style="gap:.5rem;">
            <button id="update-avatar-btn" class="btn">Update</button>
            <button id="cancel-avatar-btn" class="btn muted">Cancel</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
      qs("#cancel-avatar-btn", overlay).addEventListener("click", () => overlay.remove());
      qs("#update-avatar-btn", overlay).addEventListener("click", async () => {
        const newAvatarUrl = qs("#new-avatar-url", overlay).value.trim();
        const newAvatarAlt = qs("#new-avatar-alt", overlay).value.trim();
        if (!newAvatarUrl) { flash("Please enter a valid URL.", "error"); return; }
        try {
          await updateProfile({ url: newAvatarUrl, alt: newAvatarAlt || "" });
          avatarEl.src = newAvatarUrl;
          flash("Profile picture updated successfully!", "success");
          overlay.remove();
        } catch (e2) {
          flash(`Failed to update profile picture: ${e2.message}`, "error");
        }
      });
    });
  } else {
    let isFollowing = followers.some(f => f.name === auth?.user?.name);
    followBtn.textContent = isFollowing ? "Unfollow" : "Follow";
    followBtn.onclick = async () => {
      if (!auth?.token) { flash("Please log in to follow users.", "error"); return; }
      try {
        if (isFollowing) {
          await unfollowProfile(profile.name);
          isFollowing = false;
          followBtn.textContent = "Follow";
          const idx = followers.findIndex(f => f.name === auth.user.name);
          if (idx >= 0) followers.splice(idx, 1);
        } else {
          await followProfile(profile.name);
          isFollowing = true;
          followBtn.textContent = "Unfollow";
          followers.push({ name: auth.user.name, avatar: auth.user.avatar });
        }
        followersCountEl.textContent = `${followers.length} followers`;
      } catch (e3) {
        flash(e3.message || "Failed to update follow state", "error");
      }
    };
  }
}
