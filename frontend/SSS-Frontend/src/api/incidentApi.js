import { API_BASE_URL, apiFetch } from "./index";

const INCIDENT_URL = `${API_BASE_URL}/api/incidents`;

export async function fetchIncidents() {
  const data = await apiFetch(INCIDENT_URL);
  return Array.isArray(data) ? data : [];
}

export async function fetchIncident(id) {
  return apiFetch(`${INCIDENT_URL}/${id}`);
}

export async function createIncident(payload) {
  return apiFetch(INCIDENT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateIncident(id, payload) {
  return apiFetch(`${INCIDENT_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}