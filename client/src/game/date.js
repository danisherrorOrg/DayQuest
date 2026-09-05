// Shared local-date formatting, matching the server's `date` field shape
// (YYYY-MM-DD). Takes an optional Date so it can be unit tested without
// mocking the clock.
export function todayDateString(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

// Displays a YYYY-MM-DD day-string as e.g. "Sep 4, 2026". Built from local
// Y/M/D components rather than `new Date(dateStr)`, since the latter parses
// as UTC midnight and can shift the displayed day back one in a
// negative-offset timezone. Locale is pinned rather than left to the
// browser default so the format is consistent (and testable).
export function formatDisplayDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
