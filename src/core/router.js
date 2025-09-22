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

export class Router {
  constructor() {
    this.routes = [];
    this.notFound = null;
    this.onHashChange = this.onHashChange.bind(this);
  }

  add(pattern, handler) {
    const { regex, keys } = this._compile(pattern);
    this.routes.push({ regex, keys, handler, pattern });
    return this;
  }

  setNotFound(handler) {
    this.notFound = handler;
    return this;
  }

  navigate(hash) {
    const target = hash.startsWith("#") ? hash : `#${hash}`;
    if (location.hash === target) {
      this.onHashChange();
    } else {
      location.hash = target;
    }
  }

  start() {
    window.addEventListener("hashchange", this.onHashChange);
    this.onHashChange();
  }

  stop() {
    window.removeEventListener("hashchange", this.onHashChange);
  }

  onHashChange() {
    const full = window.location.hash || "#/";
    const [path, qs = ""] = full.split("?");
    const query = Object.fromEntries(new URLSearchParams(qs));

    for (const r of this.routes) {
      const m = path.match(r.regex);
      if (m) {
        const params = {};
        r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1] || "")));
        window.scrollTo(0, 0);
        r.handler({ params, query, hash: full });
        return;
      }
    }
    if (this.notFound) this.notFound({ hash: full, query });
  }

  _compile(pattern) {
    const keys = [];
    const escaped = pattern.replace(/[.+*?^${}()|[\]\\]/g, "\\$&");
    const regexSrc =
      "^" +
      escaped.replace(/:([A-Za-z0-9_]+)/g, (_, key) => {
        keys.push(key);
        return "([^/]+)";
      }) +
      "$";
    return { regex: new RegExp(regexSrc), keys };
  }
}

export function installLinkInterceptor(router) {
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[data-link]');
    if (!a) return;
    const href = a.getAttribute("href") || "";
    if (href.startsWith("#/")) {
      e.preventDefault();
      router.navigate(href);
    }
  });
}
