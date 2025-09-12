import { addRoute, startRouter } from "./core/router.js";
import { renderLogin } from "./pages/login/index.js";


addRoute("#/login", renderLogin);
// Placeholder: later add feed/profile routes


startRouter();