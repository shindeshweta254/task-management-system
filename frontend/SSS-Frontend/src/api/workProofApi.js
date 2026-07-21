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

export async function uploadWorkProof(formData) {
  const res = await fetch(`${API_BASE_URL}/api/work-proofs/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await jsonOrText(res);
  if (!res.ok) {
    const msg = typeof data === "string" ? data : JSON.stringify(data);
    throw new Error(`Work proof upload failed (${res.status}) ${msg}`);
  }

  return data;
}

export async function fetchMyWorkProofs(userId) {
  if (!userId) return [];
  const res = await fetch(`${API_BASE_URL}/api/work-proofs/user/${userId}`);
  const data = await jsonOrText(res);
  if (!res.ok) throw new Error("Failed to load work proofs");
  return Array.isArray(data) ? data : [];
}

export async function fetchSiteWorkProofs(siteName) {
  if (!siteName) return [];
  const res = await fetch(
    `${API_BASE_URL}/api/work-proofs/site/${encodeURIComponent(siteName)}`
  );
  const data = await jsonOrText(res);
  if (!res.ok) throw new Error("Failed to load site work proofs");
  return Array.isArray(data) ? data : [];
}

export async function fetchSiteUserWorkProofs(siteName, userId) {
  if (!siteName || !userId) return [];
  const res = await fetch(
    `${API_BASE_URL}/api/work-proofs/site/${encodeURIComponent(
      siteName
    )}/user/${userId}`
  );
  const data = await jsonOrText(res);
  if (!res.ok) throw new Error("Failed to load work proofs");
  return Array.isArray(data) ? data : [];
}

export async function fetchAllWorkProofs() {
  const res = await fetch(`${API_BASE_URL}/api/work-proofs`);
  const data = await jsonOrText(res);
  if (!res.ok) throw new Error("Failed to load all work proofs");
  return Array.isArray(data) ? data : [];
}

export async function updateWorkProofStatus(workProofId, status, remarks) {
  if (!workProofId || !status) {
    throw new Error("workProofId and status are required");
  }

  const url = `${API_BASE_URL}/api/work-proofs/${workProofId}/status?status=${encodeURIComponent(
    status
  )}&remarks=${encodeURIComponent(remarks || "")}`;

  const res = await fetch(url, {
    method: "PUT",
  });

  const data = await jsonOrText(res);
  if (!res.ok) {
    const msg = typeof data === "string" ? data : JSON.stringify(data);
    throw new Error(`Failed to update status (${res.status}) ${msg}`);
  }

  return data;
}

