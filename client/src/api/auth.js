import { apiRequest } from "./http.js";

export function registerRequest(email, password) {
  return apiRequest("/auth/register", { method: "POST", body: { email, password } });
}

export function loginRequest(email, password) {
  return apiRequest("/auth/login", { method: "POST", body: { email, password } });
}

export function refreshRequest() {
  return apiRequest("/auth/refresh", { method: "POST" });
}

export function logoutRequest() {
  return apiRequest("/auth/logout", { method: "POST" });
}

export function meRequest() {
  return apiRequest("/auth/me");
}

export function verifyEmailRequest(token) {
  return apiRequest("/auth/verify-email", { method: "POST", body: { token } });
}

export function resendVerificationRequest(email) {
  return apiRequest("/auth/resend-verification", { method: "POST", body: { email } });
}

export function forgotPasswordRequest(email) {
  return apiRequest("/auth/forgot-password", { method: "POST", body: { email } });
}

export function resetPasswordRequest(token, password) {
  return apiRequest("/auth/reset-password", { method: "POST", body: { token, password } });
}

export function changePasswordRequest(currentPassword, newPassword) {
  return apiRequest("/auth/change-password", {
    method: "POST",
    body: { currentPassword, newPassword },
  });
}

export function deleteAccountRequest(password) {
  return apiRequest("/auth/account", { method: "DELETE", body: { password } });
}
