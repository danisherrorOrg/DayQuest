// eslint-disable-next-line no-unused-vars -- next is required so Express recognizes this as error middleware
export function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  const message = status < 500 ? err.message || "Request error" : "Server error";
  res.status(status).json({ error: message });
}
