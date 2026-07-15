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

export async function fetchAllTasks() {
  const res = await fetch(`${API_BASE_URL}/api/tasks/all`);
  const data = await jsonOrText(res);
  if (!res.ok) {
    const msg = typeof data === "string" ? data : JSON.stringify(data);
    throw new Error(`Failed to load tasks: ${res.status} ${msg}`);
  }

  return Array.isArray(data) ? data : data?.tasks && Array.isArray(data.tasks) ? data.tasks : [];
}

export async function fetchEmployeeTasks(userId) {
  const res = await fetch(`${API_BASE_URL}/api/tasks/employee/${userId}`);
  const data = await res.json().catch(() => []);
  if (!res.ok) {
    throw new Error(`Failed to load employee tasks (${res.status})`);
  }
  return data;
}

export async function updateTaskStatus(id, status) {
  const res = await fetch(`${API_BASE_URL}/api/tasks/${id}/${status}`, {
    method: "PUT",
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Failed to update task (${res.status}) ${t}`);
  }
  return res.text().catch(() => null);
}

export async function markTaskCompleted(id) {
  const res = await fetch(`${API_BASE_URL}/api/tasks/${id}/COMPLETED`, {
    method: "PUT",
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Failed to complete task (${res.status}) ${t}`);
  }
  return res.text().catch(() => null);
}

export async function deleteTask(id) {
  const res = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Failed to delete task (${res.status}) ${t}`);
  }
  return res.text().catch(() => null);
}

