import { qs } from "../../core/dom.js";
import { getProfile, followProfile, unfollowProfile } from "../../api/profiles.js";
import { getPostsByUser } from "../../api/posts.js";

function me() {
  try { return JSON.parse(localStorage.getItem("profile"))?.name; }
  catch { return null; }
}

function postCard(p) {
  return `
    <article class="card">
      <h4>${p.title ?? "Untitled"}</h4>
      <p>${p.body ?? ""}</p>
    </article>
  `;
}

export async function renderProfile(username) {
  const app = qs("#app");
  const res = await fetch("/src/pages/profile/view.html");
  app.innerHTML = await res.text();

  const target = username || me();
  if (!target) {
    return (qs("#app").innerHTML = `<p class="muted">You need to log in to see your profile.</p>`);
  }

  const [profile, posts] = await Promise.all([
    getProfile(target, { include: ["_followers", "_following"] }),
    getPostsByUser(target, { limit: 50 }),
  ]);

  qs("#profile-name").textContent = `@${profile.name}`;
  qs("#profile-avatar").src = profile.avatar || "https://placehold.co/128x128";
  qs("#profile-counts").textContent =
    `${profile._count?.posts ?? 0} posts · ${profile._count?.followers ?? 0} followers · ${profile._count?.following ?? 0} following`;

  const listEl = qs("#profile-posts");
  listEl.innerHTML = posts.map(postCard).join("");

  const button = qs("#follow-btn");
  const viewingSelf = me() === profile.name;

  if (viewingSelf) {
    button.remove(); 
  } else {
    const iFollow = (profile.followers || []).some(f => f.name === me());
    button.textContent = iFollow ? "Unfollow" : "Follow";

    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        if (iFollow) await unfollowProfile(profile.name);
        else await followProfile(profile.name);
        renderProfile(profile.name);
      } catch (err) {
        console.error(err);
        button.disabled = false;
      }
    });
  }
}