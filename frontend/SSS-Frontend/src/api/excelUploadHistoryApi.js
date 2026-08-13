import { API_BASE_URL, apiFetch } from "./index";



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

      headers: getAuthHeaders(),

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

      headers: getAuthHeaders(),

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

  if (!userId) return [];
  const data = await apiFetch(`${API_BASE_URL}/api/excel-uploads/staff/my?userId=${encodeURIComponent(userId)}`);
  return Array.isArray(data) ? data : [];

}







export async function fetchStaffUploadsBySite(siteName){

  if (!siteName) return [];
  const data = await apiFetch(`${API_BASE_URL}/api/excel-uploads/staff/site/${encodeURIComponent(siteName)}`);
  return Array.isArray(data) ? data : [];

}







// ================= PROJECT HISTORY FETCH =================


export async function fetchProjectUploadsAll(){


  const data = await apiFetch(`${API_BASE_URL}/api/excel-uploads/project/all`);
  return Array.isArray(data) ? data : [];

}







export async function fetchProjectUploadsMy(userId){

  if (!userId) return [];
  const data = await apiFetch(`${API_BASE_URL}/api/excel-uploads/project/my?userId=${encodeURIComponent(userId)}`);
  return Array.isArray(data) ? data : [];

}







export async function fetchProjectUploadsBySite(siteName){

  if (!siteName) return [];
  const data = await apiFetch(`${API_BASE_URL}/api/excel-uploads/project/site/${encodeURIComponent(siteName)}`);
  return Array.isArray(data) ? data : [];

}








// ================= EXCEL ROWS =================


export async function fetchStaffExcelRows(id){


  const data = await apiFetch(`${API_BASE_URL}/api/excel-uploads/staff/${id}/rows`);
  if (!data) throw new Error("Failed to load staff excel rows");
  return data.rows || [];

}







export async function fetchProjectExcelRows(id){

  const data = await apiFetch(`${API_BASE_URL}/api/excel-uploads/project/${id}/rows`);
  if (!data) throw new Error("Failed to load project excel rows");
  return data.rows || [];

}








// ================= DOWNLOAD =================


export async function downloadStaffExcel(id){


  const response = await apiFetch(`${API_BASE_URL}/api/excel-uploads/staff/${id}/download`, { responseType: 'blob' });
  return response;

}






export async function downloadProjectExcel(id){

  const response = await apiFetch(`${API_BASE_URL}/api/excel-uploads/project/${id}/download`, { responseType: 'blob' });
  return response;

}
