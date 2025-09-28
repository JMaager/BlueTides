import { qs } from "../../core/dom.js";
import { register, login, getAuth } from "../../api/auth.js";


function validNoroffEmail(email) {
return /@(?:noroff\.no|stud\.noroff\.no)$/i.test(email);
}


export function renderRegister() {
if (getAuth()?.token) { location.hash = "#/feed"; return; }


fetch("./src/pages/register/view.html").then(r => r.text()).then(html => {
const app = qs("#app");
app.innerHTML = html;


const form = qs("#register-form");
const err = qs("#register-error");


form.addEventListener("submit", async (e) => {
  e.preventDefault();
  err.hidden = true; err.textContent = "";

  const fd = new FormData(form);
  const name = fd.get("name").toString().trim();
  const email = fd.get("email").toString().trim();
  const password = fd.get("password").toString();

  if (!validNoroffEmail(email)) {
    err.textContent = "Email must end with @noroff.no or @stud.noroff.no";
    err.hidden = false; return;
  }

  const btn = form.querySelector("button");
  btn.disabled = true; btn.textContent = "Creating…";
  try {
    await register({ name, email, password });
    await login({ email, password }); 
    location.hash = "#/feed";
  } catch (e) {
    err.textContent = e.message || "Registration failed";
    err.hidden = false;
  } finally {
    btn.disabled = false; btn.textContent = "Create account";
  }
});
});
}