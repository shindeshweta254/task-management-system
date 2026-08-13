import { API_BASE_URL, apiFetch } from "./index";

export async function createTask(payload) {
  return apiFetch(`${API_BASE_URL}/api/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}
