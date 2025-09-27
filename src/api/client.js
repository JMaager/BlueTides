/**
 * Base URL for the Noroff v2 API.
 * @type {string}
 */
const BASE_URL = "https://v2.api.noroff.dev";

/**
 * Perform a request to the Noroff v2 API and return parsed JSON.
 * Adds Authorization and X-Noroff-API-Key headers when `auth: true`.
 *
 * On non-OK responses, throws an Error whose `.status` and `.data` fields
 * contain the HTTP status code and parsed JSON error body (if any).
 *
 * @param {string} path - API path beginning with a slash, e.g. "/social/posts".
 * @param {Object} [options]
 * @param {boolean} [options.auth=false] - Include Bearer token and API key from localStorage.
 * @param {Record<string,string>} [options.headers] - Additional headers to merge.
 * @param {string} [options.body] - Stringified JSON body for POST/PUT requests.
 * @returns {Promise<any>} Parsed JSON response body.
 * @throws {Error} When the response is not ok; error has `.status` and `.data`.
 */
export async function api(path, options = {}) {
  const { auth = false, headers = {}, body, ...rest } = options;
  const store = auth ? JSON.parse(localStorage.getItem("auth") || "{}") : {};
  const token = store?.token;
  const apiKey = store["X-Noroff-API-Key"];

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...(auth && apiKey ? { "X-Noroff-API-Key": apiKey } : {}),
      ...headers,
    },
    ...(body ? { body } : {}),
    ...rest,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.errors?.[0]?.message || res.statusText || "Request failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
