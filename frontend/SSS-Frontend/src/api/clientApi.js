import { API_BASE_URL, apiFetch } from "./index";

const CLIENTS_URL = `${API_BASE_URL}/api/clients`;
const FOLLOW_UPS_URL = `${API_BASE_URL}/api/client-follow-ups`;

export async function fetchClients() {
  const data = await apiFetch(CLIENTS_URL);
  return Array.isArray(data) ? data : [];
}

export async function fetchClient(id) {
  return apiFetch(`${CLIENTS_URL}/${id}`);
}

export async function fetchTodayClientReminders() {
  const data = await apiFetch(`${CLIENTS_URL}/today-follow-ups`);
  return Array.isArray(data) ? data : [];
}

export async function fetchOverdueClientReminders() {
  const data = await apiFetch(`${CLIENTS_URL}/overdue-follow-ups`);
  return Array.isArray(data) ? data : [];
}

export async function createClient(payload) {
  return apiFetch(CLIENTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateClient(id, payload) {
  return apiFetch(`${CLIENTS_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deactivateClient(id) {
  return apiFetch(`${CLIENTS_URL}/${id}/deactivate`, {
    method: "PUT",
  });
}

export async function fetchClientFollowUps() {
  const data = await apiFetch(FOLLOW_UPS_URL);
  return Array.isArray(data) ? data : [];
}

export async function fetchTodayFollowUps() {
  const data = await apiFetch(`${FOLLOW_UPS_URL}/today`);
  return Array.isArray(data) ? data : [];
}

export async function fetchOverdueFollowUps() {
  const data = await apiFetch(`${FOLLOW_UPS_URL}/overdue`);
  return Array.isArray(data) ? data : [];
}

export async function fetchClientFollowUpHistory(clientId) {
  const data = await apiFetch(
    `${FOLLOW_UPS_URL}/client/${clientId}`
  );

  return Array.isArray(data) ? data : [];
}

export async function createClientFollowUp(clientId, payload) {
  return apiFetch(`${FOLLOW_UPS_URL}/client/${clientId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function completeClientFollowUp(
  followUpId,
  outcome = "",
  nextFollowUpDate = ""
) {
  const params = new URLSearchParams();

  if (outcome) {
    params.set("outcome", outcome);
  }

  if (nextFollowUpDate) {
    params.set("nextFollowUpDate", nextFollowUpDate);
  }

  const query = params.toString();

  return apiFetch(
    `${FOLLOW_UPS_URL}/${followUpId}/complete${
      query ? `?${query}` : ""
    }`,
    {
      method: "PUT",
    }
  );
}