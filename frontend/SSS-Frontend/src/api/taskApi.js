const API_BASE_URL = "http://localhost:8080";

async function parseResponse(response) {
  const text = await response.text();

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    if (text) {
      try {
        const errorData = JSON.parse(text);

        message =
          errorData?.message ||
          errorData?.error ||
          message;
      } catch {
        if (text.length < 250) {
          message = text;
        }
      }
    }

    throw new Error(message);
  }

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function fetchAllTasks() {
  const response = await fetch(
    `${API_BASE_URL}/api/tasks/all`
  );

  const data = await parseResponse(response);

  return Array.isArray(data) ? data : [];
}

export async function fetchEmployeeTasks(userId) {
  if (!userId) {
    return [];
  }

  const response = await fetch(
    `${API_BASE_URL}/api/tasks/employee/${userId}`
  );

  const data = await parseResponse(response);

  return Array.isArray(data) ? data : [];
}

export async function updateTaskStatus(taskId, status) {
  if (!taskId || !status) {
    throw new Error("Task ID and status are required.");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/tasks/${taskId}/${status}`,
    {
      method: "PUT",
    }
  );

  return parseResponse(response);
}

export async function markTaskCompleted(taskId) {
  return updateTaskStatus(taskId, "COMPLETED");
}

export async function deleteTask(taskId) {
  if (!taskId) {
    throw new Error("Task ID is required.");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/tasks/${taskId}`,
    {
      method: "DELETE",
    }
  );

  return parseResponse(response);
}