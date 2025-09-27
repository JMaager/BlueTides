import { addRoute } from "./core/router.js";
import { renderLogin } from "./pages/login/index.js";
import { renderFeed } from "./pages/feed/index.js";
import { renderProfile } from "./pages/profile/index.js";

addRoute("#/login", renderLogin);
addRoute("#/feed", renderFeed);
addRoute("#/profile/:id", (id) => renderProfile(id));
addRoute("#/profile", () => renderProfile());
