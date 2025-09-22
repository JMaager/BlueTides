import { addRoute, startRouter, Router, installLinkInterceptor } from "./core/router.js";
import { renderLogin } from "./pages/login/index.js";
import { renderRegister } from "./pages/register/index.js";
import { renderFeed } from "./pages/feed/index.js";
import { renderCreatePost } from "./pages/create/index.js";
import { renderPost } from "./pages/post/index.js";
import { renderProfile } from "./pages/profile/index.js";
import { spinner } from "./ui/spinner.js";
import { flash } from "./ui/flash.js";

import { getAuth, logout } from "./api/auth.js";

addRoute("#/login", renderLogin);
addRoute("#/register", renderRegister);
addRoute("#/feed", renderFeed);
addRoute("#/create", renderCreatePost);
addRoute("#/post/:id", (id) => {
  console.log("Route triggered for post:", id); 
  renderPost(id); 
});

startRouter();

function updateAuthUI() {
  const btn = document.getElementById("logout-btn");
  if (!btn) return;
  btn.style.display = getAuth()?.token ? "inline-block" : "none";
}

document.addEventListener("click", (e) => {
  if (e.target.id === "logout-btn") {
    logout();
    updateAuthUI();
    location.hash = "#/login";
  }
});

window.addEventListener("hashchange", updateAuthUI);
window.addEventListener("load", updateAuthUI);

window.addEventListener("DOMContentLoaded", () => {
  const router = new Router();

  router.setNotFound(() => {
    const el = document.querySelector("#app");
    if (el) el.innerHTML = `<p class="muted">Page not found.</p>`;
  });

  router.add("#/feed", ({ query }) => {
    const tab = query.tab || "general";
    if (query.tab !== tab) {
      router.navigate(`#/feed?tab=${tab}`);
      return;
    }
    renderFeed();
  });

  router.add("#/profile", () => {
    renderProfile();
  });

  router.add("#/u/:name", ({ params }) => {
    renderProfile(params.name);
  });

  router.add("#/post/:id", ({ params }) => {
    renderPost(params.id);
  });

  installLinkInterceptor(router);
  router.start();

  if (!location.hash) {
    router.navigate("#/feed?tab=general");
  }
});