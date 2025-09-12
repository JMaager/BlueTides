import { qs } from "../../core/dom.js";
import { login, getAuth } from "../../api/auth.js";


export function renderLogin() {
// Redirect if already logged in
if (getAuth()?.token) {
location.hash = "#/feed"; return;
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
err.hidden = true; err.textContent = "";
const fd = new FormData(form);
const payload = Object.fromEntries(fd.entries());


const btn = form.querySelector("button");
btn.disabled = true; btn.textContent = "Signing in…";
try {
await login({ email: payload.email, password: payload.password });
location.hash = "#/feed";
} catch (e) {
err.textContent = e.message || "Login failed";
err.hidden = false;
} finally {
btn.disabled = false; btn.textContent = "Sign in";
}
});
});
}