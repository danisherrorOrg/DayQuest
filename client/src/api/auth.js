import { apiRequest } from "./http.js";

export function registerRequest(email, password) {
  return apiRequest("/auth/register", { method: "POST", body: { email, password } });
}

export function loginRequest(email, password) {
  return apiRequest("/auth/login", { method: "POST", body: { email, password } });
}
