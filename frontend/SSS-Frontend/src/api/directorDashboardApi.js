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
  const res = await fetch(`${API_BASE_URL}/api/users`);
  if (!res.ok) throw new Error(`Failed to load users (${res.status})`);
  return res.json();
}

export async function fetchTasksAll() {
  const res = await fetch(`${API_BASE_URL}/api/tasks/all`);
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

export async function fetchTaskCountTotal() {
  const res = await fetch(`${API_BASE_URL}/api/tasks/count/total`);
  if (!res.ok) throw new Error(`Failed to load total tasks (${res.status})`);
  return res.json();
}

export async function fetchTaskCountPending() {
  const res = await fetch(`${API_BASE_URL}/api/tasks/count/pending`);
  if (!res.ok) throw new Error(`Failed to load pending tasks (${res.status})`);
  return res.json();
}

export async function fetchTaskCountCompleted() {
  const res = await fetch(`${API_BASE_URL}/api/tasks/count/completed`);
  if (!res.ok) throw new Error(`Failed to load completed tasks (${res.status})`);
  return res.json();
}

export async function fetchDeadlineToday() {
  const res = await fetch(`${API_BASE_URL}/api/tasks/deadline-today`);
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

