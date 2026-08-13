import { API_BASE_URL, apiFetch } from "./index";

// ===============================
// GET ALL TASKS
// ===============================

export async function fetchAllTasks() {
  const data = await apiFetch(`${API_BASE_URL}/api/tasks/all`);
  return Array.isArray(data)
    ? data
    : [];

}






// ===============================
// EMPLOYEE TASKS
// ===============================

export async function fetchEmployeeTasks(
  userId
) {

  if(!userId){
    return [];
  }

  const data = await apiFetch(`${API_BASE_URL}/api/tasks/employee/${userId}`);

  return Array.isArray(data)
    ? data
    : [];

}







// ===============================
// UPDATE STATUS
// ===============================

export async function updateTaskStatus(
  taskId,
  status
) {

  if(!taskId || !status){
    throw new Error(
      "Task ID and status are required."
    );
  }

  return apiFetch(`${API_BASE_URL}/api/tasks/${taskId}/${status}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    }
  });

}







// ===============================
// COMPLETE TASK
// ===============================

export async function markTaskCompleted(
  taskId
){

  return updateTaskStatus(
    taskId,
    "COMPLETED"
  );

}







// ===============================
// DELETE TASK
// ===============================

export async function deleteTask(
  taskId
){

  if(!taskId){
    throw new Error(
      "Task ID is required."
    );
  }

  return apiFetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
    method: "DELETE",
  });

}







// ===============================
// DASHBOARD COUNTS
// ===============================

export async function fetchTotalTasks(){

  return apiFetch(`${API_BASE_URL}/api/tasks/count/total`);

}

export async function fetchPendingTasks(){

  return apiFetch(`${API_BASE_URL}/api/tasks/count/pending`);

}

export async function fetchCompletedTasks(){

  return apiFetch(`${API_BASE_URL}/api/tasks/count/completed`);

}





// ===============================
// MY TASKS
// ===============================

export async function fetchMyTasks(){

  const data = await apiFetch(`${API_BASE_URL}/api/tasks/my-tasks`);

  return Array.isArray(data)
    ? data
    : [];

}
