import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import AuthLayout from "./AuthLayout.jsx";

export default function RegisterForm() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <h1>Create Your Account</h1>
      <p className="sub">Your saved days stay private to your account.</p>
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
        <input
          className="authInput"
          type="password"
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
          {submitting ? "Creating account…" : "Register"}
        </button>
      </form>
      <p className="sub" style={{ marginTop: 14 }}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </AuthLayout>
  );
}
