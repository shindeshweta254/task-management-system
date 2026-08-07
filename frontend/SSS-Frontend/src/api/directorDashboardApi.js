import { API_BASE_URL } from "./index";


const jsonOrText = async (res) => {

  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return res.json();
  }

  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }

};



function getAuthHeaders() {

  let loggedInUser;

  try {
    loggedInUser = JSON.parse(
      localStorage.getItem("user")
    );
  } catch {
    loggedInUser = null;
  }


  return loggedInUser?.id
    ? {
        "X-User-Id": String(loggedInUser.id)
      }
    : {};

}



/* ================= USERS ================= */

export async function fetchAllUsers() {

  const res = await fetch(
    `${API_BASE_URL}/api/users`,
    {
      headers: getAuthHeaders()
    }
  );


  if (!res.ok) {

    throw new Error(
      `Failed to load users (${res.status})`
    );

  }


  return res.json();

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


  const res = await fetch(
    `${API_BASE_URL}/api/users`,
    {
      method:"POST",

      headers:{
        "Content-Type":"application/json",
        ...getAuthHeaders()
      },

      body:JSON.stringify(userPayload)

    }
  );


  const data = await jsonOrText(res);



  if(!res.ok)
    throw new Error(
      `Failed to add employee (${res.status})`
    );


  return data;

}




/* ================= IMPORT STAFF ================= */


export async function importStaffFromExcel(file) {


  const formData = new FormData();

  formData.append(
    "file",
    file
  );


  const res = await fetch(
    `${API_BASE_URL}/api/users/import-staff`,
    {
      method:"POST",

      headers:getAuthHeaders(),

      body:formData
    }
  );


  const data = await jsonOrText(res);



  if(!res.ok)
    throw new Error(
      typeof data === "string"
        ? data
        : JSON.stringify(data)
    );


  return data;

}




/* ================= IMPORT PROJECT ================= */


export async function importProjectsFromExcel(file) {


  const formData = new FormData();

  formData.append(
    "file",
    file
  );



  const res = await fetch(
    `${API_BASE_URL}/api/projects/import`,
    {
      method:"POST",

      headers:getAuthHeaders(),

      body:formData
    }
  );



  const data = await jsonOrText(res);



  if(!res.ok)
    throw new Error(
      typeof data === "string"
        ? data
        : JSON.stringify(data)
    );



  return data;

}