const TOKEN_KEY = "dayStory.token";
const NO_REFRESH_PATHS = new Set(["/auth/login", "/auth/register", "/auth/refresh"]);

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function rawRequest(path, { method, body, token }) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
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
