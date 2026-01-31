/**
 * API client for Roadmapper backend.
 * All server communication goes through these functions.
 */

/**
 * Generic fetch wrapper: JSON request/response, throws on non-OK.
 * @param {string} path - API path (e.g. "/api/events")
 * @param {RequestInit} [options] - fetch options (method, body, headers)
 * @returns {Promise<any>} - Parsed JSON response
 */
export function api(path, options = {}) {
  return fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  }).then((r) => {
    if (!r.ok) throw new Error(r.statusText);
    return r.json();
  });
}

/**
 * Load categories from server (YAML-backed).
 * @returns {Promise<Record<string, string[]>>} - { categoryName: [tag, ...] }
 */
export async function loadCategories() {
  const data = await api("/api/categories");
  return typeof data === "object" && data !== null ? data : {};
}

/**
 * Load events from server.
 * @returns {Promise<Array<{ id: string, title: string, date: string, tags?: object, notes?: string }>>} - List of events
 */
export async function loadEvents() {
  const data = await api("/api/events");
  return Array.isArray(data) ? data : [];
}

/**
 * Save events to server (replaces full list).
 * @param {Array<object>} events - Full events array
 * @returns {Promise<Array<object>>} - Saved list
 */
export async function saveEvents(events) {
  return api("/api/events", { method: "PUT", body: JSON.stringify(events) });
}

/**
 * Load user config (theme, etc.).
 * @returns {Promise<{ theme?: string }>} - Config object
 */
export async function loadConfig() {
  try {
    return await api("/api/config");
  } catch {
    return { theme: "dark" };
  }
}

/**
 * Save user config.
 * @param {object} config - Config object to persist
 * @returns {Promise<object>} - Saved config
 */
export async function saveConfig(config) {
  return api("/api/config", { method: "PUT", body: JSON.stringify(config) });
}

/**
 * Save categories to server (YAML-backed).
 * @param {Record<string, string[]>} categories - { categoryName: [tag, ...] }
 * @returns {Promise<Record<string, string[]>>}
 */
export async function saveCategories(categories) {
  return api("/api/categories", {
    method: "PUT",
    body: JSON.stringify(categories),
  });
}
