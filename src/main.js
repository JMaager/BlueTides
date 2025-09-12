import { addRoute, startRouter } from "./core/router.js";
import { renderLogin } from "./pages/login/index.js";
import { renderRegister } from "./pages/register/index.js";
import { renderFeed } from "./pages/feed/index.js";
import { renderCreatePost } from "./pages/create/index.js";
import { spinner } from "./ui/spinner.js";
import { flash } from "./ui/flash.js";

import { getAuth, logout } from "./api/auth.js";

// routes
addRoute("#/login", renderLogin);
addRoute("#/register", renderRegister);
addRoute("#/feed", renderFeed);
addRoute("#/create", renderCreatePost);

startRouter();

// --- Logout button + auth UI ---
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

addRoute("#/login", renderLogin);
addRoute("#/register", renderRegister);
addRoute("#/feed", renderFeed);
addRoute("#/create", renderCreatePost);


startRouter();