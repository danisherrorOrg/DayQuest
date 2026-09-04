import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function LoginForm() {
  const { login } = useAuth();
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
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="screen active">
      <div className="panel">
        <h1>Welcome Back</h1>
        <p className="sub">Log in to run today's story and see your saved days.</p>
        <form onSubmit={handleSubmit}>
          <input className="authInput" type="email" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          <input className="authInput" type="password" placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          {error && <p className="authError">{error}</p>}
          <button className="primaryBtn" type="submit" disabled={submitting} style={{ width: "100%", marginTop: 6 }}>
            {submitting ? "Logging in…" : "Log In"}
          </button>
        </form>
        <p className="sub" style={{ marginTop: 14 }}>
          No account yet? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
