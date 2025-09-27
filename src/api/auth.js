import { api } from "./client.js";

/**
 * Register a new user.
 *
 * Sends a POST request to `/auth/register` and returns the API response.
 *
 * @param {{ name: string, email: string, password: string }} payload
 *  The registration data. All fields are required.
 * @returns {Promise<any>}
 *  The parsed JSON response from the API.
 * @throws {Error}
 *  If a required field is missing or the request fails.
 */
export function register(payload) {
  if (!payload.name || !payload.email || !payload.password) {
    throw new Error("Name, email, and password are required for registration.");
  }

  return api("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Log in a user, persist auth data, and ensure an API key exists.
 *
 * On success, stores `{ token, user, "X-Noroff-API-Key" }` in localStorage under the "auth" key.
 *
 * @param {{ email: string, password: string }} payload
 *  The login credentials. Both fields are required.
 * @returns {Promise<any>}
 *  The parsed JSON response from the API.
 * @throws {Error}
 *  If credentials are missing or a token/user cannot be derived from the response.
 */
export async function login(payload) {
  if (!payload.email || !payload.password) {
    throw new Error("Email and password are required for login.");
  }

  const data = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const token = data?.data?.accessToken;
  const user = data?.data;

  if (!token || !user) {
    throw new Error("Failed to log in. Please check your credentials.");
  }

  localStorage.setItem("auth", JSON.stringify({ token, user }));

  const apiKey = await ensureApiKey();
  const auth = JSON.parse(localStorage.getItem("auth") || "{}");
  auth["X-Noroff-API-Key"] = apiKey;
  localStorage.setItem("auth", JSON.stringify(auth));

  return data;
}

/**
 * Ensure there is an API key stored for the current user.
 *
 * If a key is already present in localStorage under `"X-Noroff-API-Key"`, it is returned.
 * Otherwise, requests a new key from `/auth/create-api-key`, stores it, and returns it.
 *
 * @returns {Promise<string>}
 *  The API key.
 * @throws {Error}
 *  If the API key cannot be created or retrieved.
 */
export async function ensureApiKey() {
  const store = JSON.parse(localStorage.getItem("auth") || "{}");

  if (store["X-Noroff-API-Key"]) {
    return store["X-Noroff-API-Key"];
  }

  const res = await api("/auth/create-api-key", { method: "POST", auth: true });
  const key = res?.data?.key;

  if (!key) {
    throw new Error("Failed to create API key.");
  }

  store["X-Noroff-API-Key"] = key;
  localStorage.setItem("auth", JSON.stringify(store));

  return key;
}

/**
 * Log out the current user by clearing stored auth data.
 *
 * Removes the "auth" item from localStorage.
 *
 * @returns {void}
 */
export function logout() {
  localStorage.removeItem("auth");
}

/**
 * Get the current stored auth information.
 *
 * Reads and parses the "auth" item from localStorage.
 *
 * @returns {{ token: string, user: any, ["X-Noroff-API-Key"]?: string } | null}
 *  The stored auth object, or `null` if not set or unparsable.
 */
export function getAuth() {
  try {
    return JSON.parse(localStorage.getItem("auth") || "null");
  } catch (e) {
    console.error("Failed to parse auth data:", e);
    return null;
  }
}
