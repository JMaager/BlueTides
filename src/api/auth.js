import { api } from "./client.js";

/**
 * Register a new user
 * @param {{ name:string, email:string, password:string }} payload
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
 * Log in a user, store token and user info, and ensure API key is created
 * @param {{ email:string, password:string }} payload
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
 * Create an API key if one does not already exist
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
  try {
    return JSON.parse(localStorage.getItem("auth") || "null");
  } catch (e) {
    console.error("Failed to parse auth data:", e);
    return null;
  }
}