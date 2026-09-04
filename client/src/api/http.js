const TOKEN_KEY = "dayStory.token";
const NO_REFRESH_PATHS = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/verify-email",
  "/auth/resend-verification",
  "/auth/forgot-password",
  "/auth/reset-password",
]);

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

const NETWORK_RETRIES = 2;
const NETWORK_RETRY_DELAY_MS = 600;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// fetch() rejects (rather than resolving with a bad status) when the request never reached the
// server at all — no connection, DNS failure, timeout. That's the only case worth retrying or
// relabeling; an HTTP error response is left alone and handled by the caller as usual.
async function fetchWithRetry(url, options) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fetch(url, options);
    } catch (err) {
      if (attempt >= NETWORK_RETRIES) {
        const message = navigator.onLine
          ? "Couldn't reach the server. Check your connection and try again."
          : "You're offline. Check your connection and try again.";
        const networkError = new Error(message);
        networkError.isNetworkError = true;
        networkError.cause = err;
        throw networkError;
      }
      await sleep(NETWORK_RETRY_DELAY_MS * (attempt + 1));
    }
  }
}

async function rawRequest(path, { method, body, token }) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetchWithRetry(`/api${path}`, {
    method,
    headers,
    credentials: "include",
    body: body != null ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  return { res, data };
}

// The refresh token itself lives in an httpOnly cookie set by the server, so the client
// never sees it — this just exchanges that cookie for a new short-lived access token.
let refreshPromise = null;

function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = rawRequest("/auth/refresh", { method: "POST" })
      .then(({ res, data }) => {
        if (!res.ok) {
          setToken(null);
          throw new Error(data.error || "Session expired");
        }
        setToken(data.token);
        return data.token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function apiRequest(path, { method = "GET", body } = {}) {
  let { res, data } = await rawRequest(path, { method, body, token: getToken() });

  if (res.status === 401 && !NO_REFRESH_PATHS.has(path)) {
    try {
      const newToken = await refreshAccessToken();
      ({ res, data } = await rawRequest(path, { method, body, token: newToken }));
    } catch {
      // Refresh failed (no/expired session) — fall through and surface the original 401.
    }
  }

  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
