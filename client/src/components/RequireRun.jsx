import { Navigate } from "react-router-dom";

export default function RequireRun({ run, children }) {
  if (!run) return <Navigate to="/" replace />;
  return children;
}
