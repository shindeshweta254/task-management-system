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

export async function fetchAllUsers() {
  let loggedInUser;
  try { loggedInUser = JSON.parse(localStorage.getItem("user")); } catch { loggedInUser = null; }
  const headers = loggedInUser?.id ? { "X-User-Id": String(loggedInUser.id) } : {};
  const res = await fetch(`${API_BASE_URL}/api/users`, { headers });
  if (!res.ok) throw new Error(`Failed to load users (${res.status})`);
  return res.json();
}

export async function fetchTasksAll() {
  let loggedInUser;
  try { loggedInUser = JSON.parse(localStorage.getItem("user")); } catch { loggedInUser = null; }
  const headers = loggedInUser?.id ? { "X-User-Id": String(loggedInUser.id) } : {};
  const res = await fetch(`${API_BASE_URL}/api/tasks/all`, { headers });
  const data = await jsonOrText(res);
  if (!res.ok) {
    const msg = typeof data === "string" ? data : JSON.stringify(data);
    throw new Error(`Failed to load tasks: ${res.status} ${msg}`);
  }

  // backend sometimes returns JSON string or object
  const normalized = Array.isArray(data)
    ? data
    : data?.tasks && Array.isArray(data.tasks)
      ? data.tasks
      : [];

  return normalized;
}

function getAuthHeaders() {
  let loggedInUser;
  try { loggedInUser = JSON.parse(localStorage.getItem("user")); } catch { loggedInUser = null; }
  return loggedInUser?.id ? { "X-User-Id": String(loggedInUser.id) } : {};
}

export async function fetchTaskCountTotal() {
  const res = await fetch(`${API_BASE_URL}/api/tasks/count/total`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Failed to load total tasks (${res.status})`);
  return res.json();
}

export async function fetchTaskCountPending() {
  const res = await fetch(`${API_BASE_URL}/api/tasks/count/pending`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Failed to load pending tasks (${res.status})`);
  return res.json();
}

export async function fetchTaskCountCompleted() {
  const res = await fetch(`${API_BASE_URL}/api/tasks/count/completed`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Failed to load completed tasks (${res.status})`);
  return res.json();
}

export async function fetchDeadlineToday() {
  const res = await fetch(`${API_BASE_URL}/api/tasks/deadline-today`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Failed to load today's deadlines (${res.status})`);
  return res.json();
}

export async function addUser(userPayload) {
  const res = await fetch(`${API_BASE_URL}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userPayload),
  });
  const data = await jsonOrText(res);
  if (!res.ok) throw new Error(`Failed to add employee (${res.status})`);
  return data;
}

export async function importStaffFromExcel(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/api/users/import-staff`, {
    method: "POST",
    body: formData,
  });

  const textOrJson = await jsonOrText(res);
  if (!res.ok) {
    throw new Error(typeof textOrJson === "string" ? textOrJson : JSON.stringify(textOrJson));
  }
  return textOrJson;
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

