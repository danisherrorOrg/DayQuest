import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { getToken, setToken as persistToken } from "../api/http.js";
import { registerRequest, loginRequest, meRequest } from "../api/auth.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken());
  const [email, setEmail] = useState(null);

  const applySession = useCallback((data) => {
    persistToken(data.token);
    setTokenState(data.token);
    setEmail(data.email);
  }, []);

  useEffect(() => {
    if (!token || email) return;
    meRequest()
      .then((data) => setEmail(data.email))
      .catch(() => {
        persistToken(null);
        setTokenState(null);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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
    persistToken(null);
    setTokenState(null);
    setEmail(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, email, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
