import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";

export default function VerifyEmailBanner() {
  const { emailVerified, resendVerification } = useAuth();
  const [state, setState] = useState("idle"); // idle | sending | sent | error

  if (emailVerified) return null;

  async function handleResend() {
    setState("sending");
    try {
      await resendVerification();
      setState("sent");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="verifyBanner">
      <span>Verify your email to secure your account.</span>
      {state === "sent" ? (
        <span>Check your inbox.</span>
      ) : (
        <button
          type="button"
          className="backLink"
          onClick={handleResend}
          disabled={state === "sending"}
        >
          {state === "sending" ? "Sending…" : "Resend verification email"}
        </button>
      )}
      {state === "error" && <span className="authError">Couldn&apos;t resend, try again.</span>}
    </div>
  );
}
