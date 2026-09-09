import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPasswordRequest } from "../../api/auth.js";
import AuthLayout from "./AuthLayout.jsx";

export default function ResetPasswordForm() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      await resetPasswordRequest(token, password);
      setDone(true);
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <AuthLayout>
        <h1>Reset Your Password</h1>
        <p className="authError">This reset link is missing its token.</p>
        <p className="sub" style={{ marginTop: 14 }}>
          <Link to="/forgot-password">Request a new reset link</Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h1>Reset Your Password</h1>
      {done ? (
        <p className="authSuccess">Password reset. Redirecting to log in…</p>
      ) : (
        <>
          <p className="sub">Choose a new password for your account.</p>
          <form onSubmit={handleSubmit}>
            <input
              className="authInput"
              type="password"
              placeholder="New password (min 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <input
              className="authInput"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            {error && <p className="authError">{error}</p>}
            <button
              className="primaryBtn"
              type="submit"
              disabled={submitting}
              style={{ width: "100%", marginTop: 6 }}
            >
              {submitting ? "Resetting…" : "Reset Password"}
            </button>
          </form>
        </>
      )}
      <p className="sub" style={{ marginTop: 14 }}>
        <Link to="/login">Back to log in</Link>
      </p>
    </AuthLayout>
  );
}
