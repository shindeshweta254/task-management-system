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
  const data = await jsonOrText(res);
  if (!res.ok) {
    const msg = typeof data === "string" ? data : JSON.stringify(data);
    throw new Error(`Failed to load users (${res.status}) ${msg}`);
  }
  return data;
}

export async function addTask(payload) {
  const res = await fetch(`${API_BASE_URL}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await jsonOrText(res);
  if (!res.ok) {
    const msg = typeof data === "string" ? data : JSON.stringify(data);
    throw new Error(`Task create failed (${res.status}) ${msg}`);
  }
  return data;
}

