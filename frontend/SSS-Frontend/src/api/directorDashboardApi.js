import { API_BASE_URL, apiFetch } from "./index";





/* ================= USERS ================= */

export async function fetchAllUsers() {

  const data = await apiFetch(`${API_BASE_URL}/api/users`);
  return data;

}



/* ================= TASKS ================= */

export async function fetchTasksAll() {


  const res = await fetch(
    `${API_BASE_URL}/api/tasks/all`,
    {
      headers: getAuthHeaders()
    }
  );


  const data = await jsonOrText(res);


  if (!res.ok) {

    throw new Error(
      `Failed to load tasks: ${res.status} ${
        typeof data === "string"
          ? data
          : JSON.stringify(data)
      }`
    );

  }



  return Array.isArray(data)
    ? data
    : data?.tasks && Array.isArray(data.tasks)
      ? data.tasks
      : [];

}



export async function fetchTaskCountTotal() {

  const res = await fetch(
    `${API_BASE_URL}/api/tasks/count/total`,
    {
      headers:getAuthHeaders()
    }
  );


  if(!res.ok)
    throw new Error(
      `Failed to load total tasks (${res.status})`
    );


  return res.json();

}



export async function fetchTaskCountPending() {

  const res = await fetch(
    `${API_BASE_URL}/api/tasks/count/pending`,
    {
      headers:getAuthHeaders()
    }
  );


  if(!res.ok)
    throw new Error(
      `Failed to load pending tasks (${res.status})`
    );


  return res.json();

}



export async function fetchTaskCountCompleted() {

  const res = await fetch(
    `${API_BASE_URL}/api/tasks/count/completed`,
    {
      headers:getAuthHeaders()
    }
  );


  if(!res.ok)
    throw new Error(
      `Failed to load completed tasks (${res.status})`
    );


  return res.json();

}



export async function fetchDeadlineToday() {


  const res = await fetch(
    `${API_BASE_URL}/api/tasks/deadline-today`,
    {
      headers:getAuthHeaders()
    }
  );


  if(!res.ok)
    throw new Error(
      `Failed to load today's deadlines (${res.status})`
    );


  return res.json();

}




/* ================= ATTENDANCE ================= */


/*
 Director Dashboard Attendance

 Backend:
 GET /api/attendance

 Controller:
 AttendanceController.java
 (existing @GetMapping returns all attendance records)

 Director:
 ALL employee attendance

 X-User-Id header required
*/


export async function fetchAllAttendance() {


  const res = await fetch(
    `${API_BASE_URL}/api/attendance`,
    {
      headers:getAuthHeaders()
    }
  );


  const data = await jsonOrText(res);



  if(!res.ok) {

    throw new Error(
      `Failed to load attendance (${res.status}) ${
        typeof data === "string"
          ? data
          : JSON.stringify(data)
      }`
    );

  }



  return Array.isArray(data)
    ? data
    : [];

}




/* ================= ADD USER ================= */


export async function addUser(userPayload) {

  return apiFetch(`${API_BASE_URL}/api/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userPayload),
  });

}




/* ================= IMPORT STAFF ================= */


export async function importStaffFromExcel(file) {


  const formData = new FormData();

  formData.append(
    "file",
    file
  );

  return apiFetch(`${API_BASE_URL}/api/users/import-staff`, {
    method: "POST",
    body: formData,
  });

}




/* ================= IMPORT PROJECT ================= */


export async function importProjectsFromExcel(file) {


  const formData = new FormData();

  formData.append(
    "file",
    file
  );

  return apiFetch(`${API_BASE_URL}/api/projects/import`, {
    method: "POST",
    body: formData,
  });

}
