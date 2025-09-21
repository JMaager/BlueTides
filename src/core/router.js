const routes = new Map();

export function addRoute(path, handler) {
  routes.set(path, handler);
}

export function startRouter() {
  window.addEventListener("hashchange", onRoute);
  onRoute();
}

function onRoute() {
  const auth = JSON.parse(localStorage.getItem("auth"));
  const defaultRoute = auth && auth.token ? "#/feed" : "#/login";
  const hash = location.hash || defaultRoute;
  const [path, id] = hash.replace(/^#\//, "").split("/");
  console.log("Path:", path, "ID:", id); 
  const key = id ? `#/${path}/:id` : `#/${path}`;
  const handler = routes.get(key) || routes.get(`#/${path}`);
  if (handler) handler(id);
}