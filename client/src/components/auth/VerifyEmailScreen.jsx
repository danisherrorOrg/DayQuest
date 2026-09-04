import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyEmailRequest } from "../../api/auth.js";

export default function VerifyEmailScreen() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState(token ? "verifying" : "missing");
  const [message, setMessage] = useState(null);
  const requested = useRef(false);

  useEffect(() => {
    if (!token || requested.current) return;
    requested.current = true;
    verifyEmailRequest(token)
      .then((data) => {
        setStatus("success");
        setMessage(data.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.message);
      });
  }, [token]);

  return (
    <div className="screen active">
      <div className="panel">
        <h1>Verify Your Email</h1>
        {status === "verifying" && <p className="sub">Verifying your email…</p>}
        {status === "missing" && (
          <p className="authError">This verification link is missing its token.</p>
        )}
        {status === "success" && <p className="authSuccess">{message}</p>}
        {status === "error" && <p className="authError">{message}</p>}
        <p className="sub" style={{ marginTop: 14 }}>
          <Link to="/login">Back to log in</Link>
        </p>
      </div>
    </div>
  );
}
