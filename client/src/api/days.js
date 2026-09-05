import { apiRequest } from "./http.js";

export function saveDay(date, entry) {
  return apiRequest(`/days/${date}`, { method: "PUT", body: entry });
}

export function listDays() {
  return apiRequest("/days");
}

export function getDay(date) {
  return apiRequest(`/days/${date}`);
}

export function deleteDay(date) {
  return apiRequest(`/days/${date}`, { method: "DELETE" });
}
