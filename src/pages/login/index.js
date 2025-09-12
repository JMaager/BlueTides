import { qs } from "../../core/dom.js";
import { login, getAuth } from "../../api/auth.js";

function updateAuthButtons() {
  const auth = JSON.parse(localStorage.getItem("auth"));
  const loginLink = document.getElementById("login-link");
  const logoutBtn = document.getElementById("logout-btn");

  if (loginLink && logoutBtn) {
    if (auth && auth.token) {
      loginLink.style.display = "none";
      logoutBtn.style.display = "inline-block";
    } else {
      loginLink.style.display = "inline-block";
      logoutBtn.style.display = "none";
    }
  } else {
    console.error("Login link or logout button not found in the DOM.");
  }
}

export function renderLogin() {
  if (getAuth()?.token) {
    location.hash = "#/feed";
    return;
  }

  fetch("./src/pages/login/view.html")
    .then((r) => r.text())
    .then((html) => {
      const app = qs("#app");
      app.innerHTML = html;
      const form = qs("#login-form");
      const err = qs("#login-error");

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        err.hidden = true;
        err.textContent = "";
        const fd = new FormData(form);
        const payload = Object.fromEntries(fd.entries());

        const btn = form.querySelector("button");
        btn.disabled = true;
        btn.textContent = "Signing in…";
        try {
          await login({ email: payload.email, password: payload.password });
          updateAuthButtons();
          location.hash = "#/feed";
        } catch (e) {
          err.textContent = e.message || "Login failed";
          err.hidden = false;
        } finally {
          btn.disabled = false;
          btn.textContent = "Sign in";
        }
      });
    });
}

document.addEventListener("DOMContentLoaded", () => {
  updateAuthButtons();

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("auth");
      updateAuthButtons();
      location.reload();
    });
  }
});