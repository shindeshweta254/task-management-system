export const API_BASE_URL = "http://localhost:8080";

/**
 * Builds the common auth headers for every authenticated API request.
 * Sends both the JWT bearer token and the temporary X-User-Id header.
 */
export function getAuthHeaders(extra = {}) {
  let loggedInUser = null;

  try {
    loggedInUser = JSON.parse(localStorage.getItem("user")) || null;
  } catch {
    loggedInUser = null;
  }

  const rawToken = localStorage.getItem("token") || "";
  const token = typeof rawToken === "string" ? rawToken.trim() : "";
  const rawTokenType = localStorage.getItem("tokenType") || "Bearer";
  const tokenType = typeof rawTokenType === "string" ? rawTokenType.trim() : "Bearer";
  const userId = String(
    loggedInUser?.id || loggedInUser?.userId || loggedInUser?.employeeId || ""
  ).trim();

  const headers = {};

  if (token) {
    headers["Authorization"] = `${tokenType} ${token}`;
  }

  if (userId) {
    headers["X-User-Id"] = userId;
  }

  return { ...headers, ...extra };
}

// Central handler for 401 Unauthorized responses from fetch-based calls.
// Clears auth state and redirects to login to avoid scattered handling across files.
export function handleUnauthorizedResponse(response) {
  try {
    const status = response?.status;
    if (status === 401) {
      // IMPORTANT: Per user request, DO NOT automatically redirect on 401.
      // The component making the API call is responsible for handling the error
      // and showing an appropriate message without logging the user out.
      // try {
      //   localStorage.removeItem("token");
      //   localStorage.removeItem("tokenType");
      //   localStorage.removeItem("user");
      //   localStorage.removeItem("userId");
      // } catch (e) {
      //   // ignore
      // }
      // if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      //   window.location.href = "/login";
      // }
    }
  } catch (e) {
    // ignore
  }
  return false;
}

/**
 * Centralized fetch function that includes authentication headers,
 * handles unauthorized responses, and parses JSON/text responses.
 *
 * @param {RequestInfo} input The URL to fetch.
 * @param {RequestInit} [init={}] The fetch options.
 * @returns {Promise<any>} The parsed JSON or text response.
 * @throws {Error} Throws an error for non-OK responses or unauthorized access.
 */
export async function apiFetch(input, init = {}) {
  const allHeaders = getAuthHeaders(init.headers || {});
  const response = await fetch(input, {
    ...init,
    headers: allHeaders,
  });

  if (handleUnauthorizedResponse(response)) {
    throw new Error("Unauthorized");
  }

  const contentType = response.headers.get("content-type") || "";
  let data;
  if (contentType.includes("application/json")) {
    data = await response.json().catch(() => null);
  } else {
    data = await response.text().catch(() => "");
  }

  if (!response.ok) {
    const message = (typeof data === 'object' && data !== null && data.message) ? data.message : (typeof data === 'string' ? data : `Request failed with status ${response.status}`);
    throw new Error(message);
  }

  return data;
}
