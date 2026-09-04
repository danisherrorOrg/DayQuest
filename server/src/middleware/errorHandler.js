export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(err);
  const status = err.status || 500;
  const message = status < 500 ? err.message || "Request error" : "Server error";
  res.status(status).json({ error: message });
}
