import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPasswordRequest } from "../../api/auth.js";
import AuthLayout from "./AuthLayout.jsx";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const data = await forgotPasswordRequest(email);
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <h1>Reset Your Password</h1>
      <p className="sub">
        Enter your account email and we&apos;ll send you a link to reset your password.
      </p>
      {message ? (
        <p className="authSuccess">{message}</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            className="authInput"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          {error && <p className="authError">{error}</p>}
          <button
            className="primaryBtn"
            type="submit"
            disabled={submitting}
            style={{ width: "100%", marginTop: 6 }}
          >
            {submitting ? "Sending…" : "Send Reset Link"}
          </button>
        </form>
      )}
      <p className="sub" style={{ marginTop: 14 }}>
        <Link to="/login">Back to log in</Link>
      </p>
    </AuthLayout>
  );
}
