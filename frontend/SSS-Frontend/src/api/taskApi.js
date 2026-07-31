const API_BASE_URL = "http://localhost:8080";


function getUserHeaders() {

  const user = JSON.parse(
    localStorage.getItem("user")
  );


  if (!user?.id) {
    throw new Error(
      "User session not found. Please login again."
    );
  }


  return {
    "X-User-Id": String(user.id),
    "Content-Type": "application/json"
  };

}



async function parseResponse(response) {

  const text = await response.text();


  if (!response.ok) {

    let message =
      `Request failed with status ${response.status}`;


    if (text) {

      try {

        const errorData =
          JSON.parse(text);


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




// ===============================
// GET ALL TASKS
// ===============================

export async function fetchAllTasks() {


  const response = await fetch(

    `${API_BASE_URL}/api/tasks/all`,

    {

      headers:
        getUserHeaders()

    }

  );


  const data =
    await parseResponse(response);


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



  const response = await fetch(

    `${API_BASE_URL}/api/tasks/employee/${userId}`,

    {

      headers:
        getUserHeaders()

    }

  );



  const data =
    await parseResponse(response);



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



  const response = await fetch(

    `${API_BASE_URL}/api/tasks/${taskId}/${status}`,

    {

      method:"PUT",

      headers:
        getUserHeaders()

    }

  );



  return parseResponse(response);

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



  const response = await fetch(

    `${API_BASE_URL}/api/tasks/${taskId}`,

    {

      method:"DELETE",

      headers:
        getUserHeaders()

    }

  );



  return parseResponse(response);

}







// ===============================
// DASHBOARD COUNTS
// ===============================


export async function fetchTotalTasks(){

  const response = await fetch(

    `${API_BASE_URL}/api/tasks/count/total`,

    {

      headers:
        getUserHeaders()

    }

  );


  return parseResponse(response);

}




export async function fetchPendingTasks(){

  const response = await fetch(

    `${API_BASE_URL}/api/tasks/count/pending`,

    {

      headers:
        getUserHeaders()

    }

  );


  return parseResponse(response);

}





export async function fetchCompletedTasks(){

  const response = await fetch(

    `${API_BASE_URL}/api/tasks/count/completed`,

    {

      headers:
        getUserHeaders()

    }

  );


  return parseResponse(response);

}





// ===============================
// MY TASKS
// ===============================

export async function fetchMyTasks(){


  const response = await fetch(

    `${API_BASE_URL}/api/tasks/my-tasks`,

    {

      headers:
        getUserHeaders()

    }

  );


  const data =
    await parseResponse(response);



  return Array.isArray(data)
    ? data
    : [];

}