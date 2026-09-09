import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { getToken, setToken as persistToken } from "../api/http.js";
import {
  registerRequest,
  loginRequest,
  refreshRequest,
  logoutRequest,
  resendVerificationRequest,
  changePasswordRequest,
  deleteAccountRequest,
  updateRemindersRequest,
} from "../api/auth.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken());
  const [email, setEmail] = useState(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  const applySession = useCallback((data) => {
    persistToken(data.token);
    setTokenState(data.token);
    setEmail(data.email);
    setEmailVerified(Boolean(data.emailVerified));
    setRemindersEnabled(data.remindersEnabled !== false);
  }, []);

  const clearSession = useCallback(() => {
    persistToken(null);
    setTokenState(null);
    setEmail(null);
    setEmailVerified(false);
    setRemindersEnabled(true);
  }, []);

  // Silently exchange the httpOnly refresh cookie (if any) for a fresh access token on load,
  // so a page reload doesn't require re-login just because the short-lived token expired.
  // The refresh endpoint rotates the cookie's token on every call, so two concurrent calls
  // sharing the same stale cookie race: whichever the server sees second finds its token
  // already rotated away and 401s, logging the user right back out. React 18 StrictMode's
  // dev-only double-invoke of this effect made that race easy to hit on an ordinary reload —
  // the requestedRef guard (same one-shot-effect idiom as VerifyEmailScreen/LogCardModeScreen)
  // ensures only one refresh call actually goes out per mount.
  const requestedRef = useRef(false);
  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;
    refreshRequest().then(applySession).catch(clearSession);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const register = useCallback(
    async (emailInput, password) => {
      const data = await registerRequest(emailInput, password);
      applySession(data);
    },
    [applySession],
  );

  const login = useCallback(
    async (emailInput, password) => {
      const data = await loginRequest(emailInput, password);
      applySession(data);
    },
    [applySession],
  );

  const logout = useCallback(() => {
    logoutRequest().catch(() => {});
    clearSession();
  }, [clearSession]);

  const resendVerification = useCallback(() => {
    if (!email) return Promise.reject(new Error("Not logged in"));
    return resendVerificationRequest(email);
  }, [email]);

  const changePassword = useCallback(
    async (currentPassword, newPassword) => {
      const data = await changePasswordRequest(currentPassword, newPassword);
      applySession(data);
    },
    [applySession],
  );

  const deleteAccount = useCallback(
    async (password) => {
      await deleteAccountRequest(password);
      clearSession();
    },
    [clearSession],
  );

  const updateReminders = useCallback(async (enabled) => {
    const data = await updateRemindersRequest(enabled);
    setRemindersEnabled(Boolean(data.remindersEnabled));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        email,
        emailVerified,
        remindersEnabled,
        register,
        login,
        logout,
        resendVerification,
        changePassword,
        deleteAccount,
        updateReminders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
