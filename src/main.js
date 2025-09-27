import { Router, installLinkInterceptor } from "./core/router.js";
import { renderLogin } from "./pages/login/index.js";
import { renderRegister } from "./pages/register/index.js";
import { renderFeed } from "./pages/feed/index.js";
import { renderCreatePost } from "./pages/create/index.js";
import { renderPost } from "./pages/post/index.js";
import { renderProfile } from "./pages/profile/index.js";
import { flash } from "./ui/flash.js";
import { getAuth, logout } from "./api/auth.js";

const router = new Router();

router.add("#/login", () => { renderLogin(); });
router.add("#/register", () => { renderRegister(); });
router.add("#/feed", () => { renderFeed(); });
router.add("#/create", () => { renderCreatePost(); });
router.add("#/post/:id", ({ params }) => { renderPost(params.id); });

router.add("#/profile/:id", ({ params }) => {
  if (!params.id || typeof params.id !== "string") {
    flash("User ID is missing or invalid", "error");
    return;
    }
  renderProfile(params.id);
});

router.add("#/profile", () => {
  const auth = getAuth();
  if (!auth?.user?.name) {
    flash("You must be logged in to view your profile", "error");
    router.navigate("#/login");
    return;
  }
  renderProfile(auth.user.name);
});

router.setNotFound(() => {
  const el = document.querySelector("#app");
  if (el) el.innerHTML = `<p class="muted">Page not found.</p>`;
});

installLinkInterceptor(router);
router.start();

if (!location.hash) {
  router.navigate("#/feed?tab=general");
}

function updateHeaderAuthUI() {
  const profileBtn = document.getElementById("profile-btn");
  const profileDropdown = document.getElementById("profile-dropdown");
  const profileAvatar = document.getElementById("profile-avatar");
  const loginLink = document.getElementById("login-link");
  const viewProfileLink = document.querySelector("#profile-dropdown a[href='#/profile']");
  const auth = getAuth();

  if (auth?.token) {
    const url = auth.user?.avatar?.url || "https://placehold.co/64x64";
    const alt = auth.user?.avatar?.alt || "Profile";
    if (profileAvatar) {
      profileAvatar.src = url;
      profileAvatar.alt = alt;
    }
    if (loginLink) loginLink.style.display = "none";
    if (viewProfileLink) viewProfileLink.href = `#/profile/${auth.user.name}`;

    if (profileBtn && profileDropdown) {
      profileBtn.onclick = () => {
        profileDropdown.style.display = profileDropdown.style.display === "block" ? "none" : "block";
      };
      document.addEventListener("click", (e) => {
        if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
          profileDropdown.style.display = "none";
        }
      });
      const logoutBtn = document.getElementById("logout-btn");
      if (logoutBtn) {
        logoutBtn.onclick = () => {
          logout();
          profileDropdown.style.display = "none";
          if (loginLink) loginLink.style.display = "inline";
          if (profileAvatar) {
            profileAvatar.src = "https://placehold.co/64x64";
            profileAvatar.alt = "Log in";
          }
          router.navigate("#/login");
        };
      }
    }
  } else {
    if (profileAvatar) {
      profileAvatar.src = "https://placehold.co/64x64";
      profileAvatar.alt = "Log in";
    }
    if (loginLink) loginLink.style.display = "inline";
    if (viewProfileLink) viewProfileLink.href = "#/profile";
    const profileBtn = document.getElementById("profile-btn");
    if (profileBtn) {
      profileBtn.onclick = () => { location.hash = "#/login"; };
    }
  }
}

document.addEventListener("DOMContentLoaded", updateHeaderAuthUI);
