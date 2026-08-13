import { API_BASE_URL, apiFetch } from "./index";

export async function fetchAllProjects() {
  const data = await apiFetch(`${API_BASE_URL}/api/projects`);
  return Array.isArray(data) ? data : [];
}

export async function fetchProjectById(id) {
  return apiFetch(`${API_BASE_URL}/api/projects/${id}`);
}

export async function importProjectsFromExcel(file) {
  const formData = new FormData();
  formData.append("file", file);

  return apiFetch(`${API_BASE_URL}/api/projects/import`, {
    method: "POST",
    body: formData,
  });
}

export async function updateProject(id, payload) {
  return apiFetch(`${API_BASE_URL}/api/projects/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteProject(id) {
  return apiFetch(`${API_BASE_URL}/api/projects/${id}`, {
    method: "DELETE",
  });
}

export async function updateProjectEmployee(projectId, employeeId, payload) {
  // Backend route used by Projects page (existing): /api/projects/employee/{empId}
  return apiFetch(`${API_BASE_URL}/api/projects/employee/${employeeId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteProjectEmployee(employeeId) {
  return apiFetch(`${API_BASE_URL}/api/projects/employee/${employeeId}`, {
    method: "DELETE",
  });
}
