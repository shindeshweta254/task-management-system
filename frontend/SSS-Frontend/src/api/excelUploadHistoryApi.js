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

export async function uploadStaffHistory({ file, uploadedByUserId, uploadedByName, uploadedByRole }) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("uploadedByUserId", String(uploadedByUserId));
  formData.append("uploadedByName", uploadedByName || "");
  formData.append("uploadedByRole", uploadedByRole || "");

  const res = await fetch(`${API_BASE_URL}/api/excel-uploads/staff/history`, {
    method: "POST",
    body: formData,
  });

  const data = await jsonOrText(res);
  if (!res.ok) {
    const msg = typeof data === "string" ? data : JSON.stringify(data);
    throw new Error(`Failed to save staff upload history (${res.status}) ${msg}`);
  }
  return data;
}

export async function uploadProjectHistory({ file, uploadedByUserId, uploadedByName, uploadedByRole, siteName }) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("uploadedByUserId", String(uploadedByUserId));
  formData.append("uploadedByName", uploadedByName || "");
  formData.append("uploadedByRole", uploadedByRole || "");
  if (siteName) formData.append("siteName", siteName);

  const res = await fetch(`${API_BASE_URL}/api/excel-uploads/project/history`, {
    method: "POST",
    body: formData,
  });

  const data = await jsonOrText(res);
  if (!res.ok) {
    const msg = typeof data === "string" ? data : JSON.stringify(data);
    throw new Error(`Failed to save project upload history (${res.status}) ${msg}`);
  }
  return data;
}

export async function fetchStaffUploadsAll() {
  const res = await fetch(`${API_BASE_URL}/api/excel-uploads/staff/all`);
  if (res.status === 404) return [];
  const data = await jsonOrText(res);
  if (!res.ok) return [];
  return Array.isArray(data) ? data : [];
}

export async function fetchStaffUploadsMy(userId) {
  const res = await fetch(`${API_BASE_URL}/api/excel-uploads/staff/my?userId=${encodeURIComponent(userId)}`);
  if (res.status === 404) return [];
  const data = await jsonOrText(res);
  if (!res.ok) return [];
  return Array.isArray(data) ? data : [];
}

export async function fetchStaffUploadsBySite(siteName) {
  const res = await fetch(`${API_BASE_URL}/api/excel-uploads/staff/site/${encodeURIComponent(siteName)}`);
  if (res.status === 404) return [];
  const data = await jsonOrText(res);
  if (!res.ok) return [];
  return Array.isArray(data) ? data : [];
}

export async function fetchProjectUploadsAll() {
  const res = await fetch(`${API_BASE_URL}/api/excel-uploads/project/all`);
  if (res.status === 404) return [];
  const data = await jsonOrText(res);
  if (!res.ok) return [];
  return Array.isArray(data) ? data : [];
}

export async function fetchProjectUploadsMy(userId) {
  const res = await fetch(`${API_BASE_URL}/api/excel-uploads/project/my?userId=${encodeURIComponent(userId)}`);
  if (res.status === 404) return [];
  const data = await jsonOrText(res);
  if (!res.ok) return [];
  return Array.isArray(data) ? data : [];
}

export async function fetchProjectUploadsBySite(siteName) {
  const res = await fetch(`${API_BASE_URL}/api/excel-uploads/project/site/${encodeURIComponent(siteName)}`);
  if (res.status === 404) return [];
  const data = await jsonOrText(res);
  if (!res.ok) return [];
  return Array.isArray(data) ? data : [];
}



export async function fetchStaffExcelRows(id) {
  const res = await fetch(`${API_BASE_URL}/api/excel-uploads/staff/${id}/rows`);
  const data = await jsonOrText(res);
  if (!res.ok) throw new Error("Failed to load staff excel rows");
  return data?.rows || [];
}

export async function fetchProjectExcelRows(id) {
  const res = await fetch(`${API_BASE_URL}/api/excel-uploads/project/${id}/rows`);
  const data = await jsonOrText(res);
  if (!res.ok) throw new Error("Failed to load project excel rows");
  return data?.rows || [];
}

export async function downloadStaffExcel(id) {
  const res = await fetch(`${API_BASE_URL}/api/excel-uploads/staff/${id}/download`);
  if (!res.ok) throw new Error("Failed to download staff excel");
  const blob = await res.blob();
  return blob;
}

export async function downloadProjectExcel(id) {
  const res = await fetch(`${API_BASE_URL}/api/excel-uploads/project/${id}/download`);
  if (!res.ok) throw new Error("Failed to download project excel");
  const blob = await res.blob();
  return blob;
}

