import { API_BASE_URL } from "./index";

const jsonOrText = async (res) => {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export async function fetchAllProjects() {
  const res = await fetch(`${API_BASE_URL}/api/projects`);
  const data = await jsonOrText(res);
  if (!res.ok) {
    const msg = typeof data === "string" ? data : JSON.stringify(data);
    throw new Error(`Failed to load projects (${res.status}) ${msg}`);
  }
  return Array.isArray(data) ? data : [];
}

export async function fetchProjectById(id) {
  const res = await fetch(`${API_BASE_URL}/api/projects/${id}`);
  const data = await jsonOrText(res);
  if (!res.ok) {
    const msg = typeof data === "string" ? data : JSON.stringify(data);
    throw new Error(`Failed to load project (${res.status}) ${msg}`);
  }
  return data;
}

export async function importProjectsFromExcel(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/api/projects/import`, {
    method: "POST",
    body: formData,
  });

  const textOrJson = await jsonOrText(res);
  if (!res.ok) {
    throw new Error(typeof textOrJson === "string" ? textOrJson : JSON.stringify(textOrJson));
  }
  return textOrJson;
}

export async function updateProject(id, payload) {
  const res = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await jsonOrText(res);
  if (!res.ok) {
    const msg = typeof data === "string" ? data : JSON.stringify(data);
    throw new Error(`Failed to update project (${res.status}) ${msg}`);
  }
  return data;
}

export async function deleteProject(id) {
  const res = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
    method: "DELETE",
  });

  const data = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(typeof data === "string" ? data : "Delete project failed");
  }
  return data;
}

export async function updateProjectEmployee(projectId, employeeId, payload) {
  // Backend route used by Projects page (existing): /api/projects/employee/{empId}
  const res = await fetch(`${API_BASE_URL}/api/projects/employee/${employeeId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await jsonOrText(res);
  if (!res.ok) {
    const msg = typeof data === "string" ? data : JSON.stringify(data);
    throw new Error(`Failed to update employee (${res.status}) ${msg}`);
  }
  return data;
}

export async function deleteProjectEmployee(employeeId) {
  const res = await fetch(`${API_BASE_URL}/api/projects/employee/${employeeId}`, {
    method: "DELETE",
  });

  const data = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(typeof data === "string" ? data : "Delete employee failed");
  }
  return data;
}

