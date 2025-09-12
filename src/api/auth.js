import { api } from "./client.js";

/**
 * Register a new user
 * @param {{ name:string, email:string, password:string }} payload
 */
export function register(payload) {
  return api("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Log in a user, store token and user info, and ensure API key is created
 * @param {{ email:string, password:string }} payload
 */
export async function login(payload) {
  const data = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const token = data?.data?.accessToken;
  const user = data?.data;

  localStorage.setItem("auth", JSON.stringify({ token, user }));

  await ensureApiKey(); // make sure API key is available

  return data;
}

/**
 * Create an API key if one does not already exist
 */
export async function ensureApiKey() {
  const store = JSON.parse(localStorage.getItem("auth") || "{}");

  if (store.apiKey) return store.apiKey;

  const res = await api("/auth/create-api-key", { method: "POST", auth: true });
  const key = res?.data?.key;

  store.apiKey = key;
  localStorage.setItem("auth", JSON.stringify(store));

  return key;
}

/**
 * Clear stored auth info
 */
export function logout() {
  localStorage.removeItem("auth");
}

/**
 * Get the current stored auth info
 * @returns {{ token:string, user:any, apiKey?:string } | null}
 */
export function getAuth() {
  return JSON.parse(localStorage.getItem("auth") || "null");
}
