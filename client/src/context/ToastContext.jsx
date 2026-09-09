import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const ToastContext = createContext(null);
let nextToastId = 0;

// A bottom-center toast stack, mounted once at the app root, so any screen
// can call useToast() to acknowledge an action (save, password change,
// settings toggle) without each screen owning its own banner state.
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timeoutIdsRef = useRef(new Map());

  useEffect(() => {
    const timeoutIds = timeoutIdsRef.current;
    return () => {
      timeoutIds.forEach((id) => clearTimeout(id));
      timeoutIds.clear();
    };
  }, []);

  const showToast = useCallback((message, tone = "success") => {
    const id = ++nextToastId;
    setToasts((prev) => [...prev, { id, message, tone }]);
    const timeoutId = setTimeout(() => {
      timeoutIdsRef.current.delete(id);
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
    timeoutIdsRef.current.set(id, timeoutId);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="toastStack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tone}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
