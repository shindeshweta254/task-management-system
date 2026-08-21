import { API_BASE_URL, apiFetch } from "./index";

export async function fetchAllUsers() {
  const data = await apiFetch(`${API_BASE_URL}/api/users/task-assignees`);
  return data;
}

export async function addTask(payload) {
  return apiFetch(`${API_BASE_URL}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// ========== TEAM MANAGEMENT APIS ==========

export async function fetchMySiteTeam() {
  const data = await apiFetch(`${API_BASE_URL}/api/users/my-site-team`);
  return data;
}

export async function fetchUsersBySiteCode(siteCode) {
  const data = await apiFetch(
    `${API_BASE_URL}/api/users/site/${encodeURIComponent(siteCode)}`,
  );
  return data;
}

export async function addEmployee(userData) {
  return apiFetch(`${API_BASE_URL}/api/users/add-employee`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
}

export async function updateUserContact(userId, contactNo) {
  return apiFetch(`${API_BASE_URL}/api/users/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contactNo }),
  });
}

export async function uploadSiteTeamExcel(file) {
  const formData = new FormData();
  formData.append("file", file); // Ensure 'file' is the correct field name for the backend
  return apiFetch(`${API_BASE_URL}/api/users/import-site-team`, {
    method: "POST",
    body: formData,
  });
}

