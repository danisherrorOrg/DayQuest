// Shared local-date formatting, matching the server's `date` field shape
// (YYYY-MM-DD). Takes an optional Date so it can be unit tested without
// mocking the clock.
export function todayDateString(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
