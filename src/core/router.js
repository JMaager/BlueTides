const routes = new Map();


export function addRoute(path, handler) { routes.set(path, handler); }
export function startRouter() { window.addEventListener("hashchange", onRoute); onRoute(); }


function onRoute() {
const hash = location.hash || "#/login";
const [path, id] = hash.replace(/^#\//, "").split("/");
const key = id ? `#/${path}/:id` : `#/${path}`;
const handler = routes.get(key) || routes.get(`#/${path}`);
if (handler) handler(id);
}