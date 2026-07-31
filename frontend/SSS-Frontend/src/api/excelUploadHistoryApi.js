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



// ================= STAFF EXCEL UPLOAD =================

export async function uploadStaffHistory({
  file,
  uploadedByUserId,
  uploadedByName,
  uploadedByRole
}) {


  const formData = new FormData();


  formData.append("file", file);

  formData.append(
    "uploadedByUserId",
    String(uploadedByUserId)
  );

  formData.append(
    "uploadedByName",
    uploadedByName || ""
  );

  formData.append(
    "uploadedByRole",
    uploadedByRole || ""
  );



  const res = await fetch(
    `${API_BASE_URL}/api/excel-uploads/staff/history`,
    {
      method: "POST",

      headers: {
        "X-User-Id": String(uploadedByUserId),
      },

      body: formData,
    }
  );



  const data = await jsonOrText(res);



  if (!res.ok) {

    const msg =
      typeof data === "string"
        ? data
        : JSON.stringify(data);


    throw new Error(
      `Failed to save staff upload history (${res.status}) ${msg}`
    );

  }


  return data;

}






// ================= PROJECT EXCEL UPLOAD =================


export async function uploadProjectHistory({
  file,
  uploadedByUserId,
  uploadedByName,
  uploadedByRole,
  siteName
}) {


  const formData = new FormData();


  formData.append(
    "file",
    file
  );


  formData.append(
    "uploadedByUserId",
    String(uploadedByUserId)
  );


  formData.append(
    "uploadedByName",
    uploadedByName || ""
  );


  formData.append(
    "uploadedByRole",
    uploadedByRole || ""
  );



  if(siteName){
    formData.append(
      "siteName",
      siteName
    );
  }





  const res = await fetch(
    `${API_BASE_URL}/api/excel-uploads/project/history`,
    {
      method:"POST",

      headers:{
        "X-User-Id":String(uploadedByUserId),
      },

      body:formData,
    }
  );



  const data = await jsonOrText(res);



  if(!res.ok){

    const msg =
      typeof data === "string"
      ? data
      : JSON.stringify(data);



    throw new Error(
      `Failed to save project upload history (${res.status}) ${msg}`
    );

  }


  return data;

}






// ================= AUTH HEADER =================


function getAuthHeaders(){


  let loggedInUser = null;


  try{

    loggedInUser =
      JSON.parse(
        localStorage.getItem("user")
      );

  }
  catch{

    loggedInUser=null;

  }



  return loggedInUser?.id
    ? {
        "X-User-Id":
        String(loggedInUser.id)
      }
    : {};

}







// ================= STAFF HISTORY FETCH =================


export async function fetchStaffUploadsAll(){


  const res = await fetch(
    `${API_BASE_URL}/api/excel-uploads/staff/all`,
    {
      headers:getAuthHeaders()
    }
  );


  if(res.status===404)
    return [];



  const data =
    await jsonOrText(res);



  if(!res.ok)
    return [];



  return Array.isArray(data)
    ? data
    : [];

}







export async function fetchStaffUploadsMy(userId){


  const res = await fetch(
    `${API_BASE_URL}/api/excel-uploads/staff/my?userId=${encodeURIComponent(userId)}`,
    {
      headers:getAuthHeaders()
    }
  );



  if(res.status===404)
    return [];



  const data =
    await jsonOrText(res);



  if(!res.ok)
    return [];



  return Array.isArray(data)
    ? data
    : [];

}







export async function fetchStaffUploadsBySite(siteName){


  const res = await fetch(
    `${API_BASE_URL}/api/excel-uploads/staff/site/${encodeURIComponent(siteName)}`,
    {
      headers:getAuthHeaders()
    }
  );



  if(res.status===404)
    return [];



  const data =
    await jsonOrText(res);



  if(!res.ok)
    return [];



  return Array.isArray(data)
    ? data
    : [];

}







// ================= PROJECT HISTORY FETCH =================


export async function fetchProjectUploadsAll(){


  const res = await fetch(
    `${API_BASE_URL}/api/excel-uploads/project/all`,
    {
      headers:getAuthHeaders()
    }
  );



  if(res.status===404)
    return [];



  const data =
    await jsonOrText(res);



  if(!res.ok)
    return [];



  return Array.isArray(data)
    ? data
    : [];

}







export async function fetchProjectUploadsMy(userId){


  const res = await fetch(
    `${API_BASE_URL}/api/excel-uploads/project/my?userId=${encodeURIComponent(userId)}`,
    {
      headers:getAuthHeaders()
    }
  );



  if(res.status===404)
    return [];



  const data =
    await jsonOrText(res);



  if(!res.ok)
    return [];



  return Array.isArray(data)
    ? data
    : [];

}







export async function fetchProjectUploadsBySite(siteName){


  const res = await fetch(
    `${API_BASE_URL}/api/excel-uploads/project/site/${encodeURIComponent(siteName)}`,
    {
      headers:getAuthHeaders()
    }
  );



  if(res.status===404)
    return [];



  const data =
    await jsonOrText(res);



  if(!res.ok)
    return [];



  return Array.isArray(data)
    ? data
    : [];

}








// ================= EXCEL ROWS =================


export async function fetchStaffExcelRows(id){


  const res = await fetch(
    `${API_BASE_URL}/api/excel-uploads/staff/${id}/rows`,
    {
      headers:getAuthHeaders()
    }
  );



  const data =
    await jsonOrText(res);



  if(!res.ok)
    throw new Error(
      "Failed to load staff excel rows"
    );



  return data?.rows || [];

}







export async function fetchProjectExcelRows(id){


  const res = await fetch(
    `${API_BASE_URL}/api/excel-uploads/project/${id}/rows`,
    {
      headers:getAuthHeaders()
    }
  );



  const data =
    await jsonOrText(res);



  if(!res.ok)
    throw new Error(
      "Failed to load project excel rows"
    );



  return data?.rows || [];

}








// ================= DOWNLOAD =================


export async function downloadStaffExcel(id){


  const res = await fetch(
    `${API_BASE_URL}/api/excel-uploads/staff/${id}/download`,
    {
      headers:getAuthHeaders()
    }
  );


  if(!res.ok)
    throw new Error(
      "Failed to download staff excel"
    );



  return await res.blob();

}






export async function downloadProjectExcel(id){


  const res = await fetch(
    `${API_BASE_URL}/api/excel-uploads/project/${id}/download`,
    {
      headers:getAuthHeaders()
    }
  );



  if(!res.ok)
    throw new Error(
      "Failed to download project excel"
    );



  return await res.blob();

}