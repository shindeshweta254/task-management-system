import { API_BASE_URL, apiFetch } from "./index";

export async function uploadWorkProof(formData) {
  return apiFetch(`${API_BASE_URL}/api/work-proofs/upload`, {
    method: "POST",
    body: formData,
  });
}

export async function fetchMyWorkProofs(userId) {
  if (!userId) return [];
  const data = await apiFetch(`${API_BASE_URL}/api/work-proofs/user/${userId}`);
  return Array.isArray(data) ? data : [];
}

export async function fetchSiteWorkProofs(siteName) {
  if (!siteName) return [];
  const data = await apiFetch(
    `${API_BASE_URL}/api/work-proofs/site/${encodeURIComponent(siteName)}`,
  );
  return Array.isArray(data) ? data : [];
}

export async function fetchSiteUserWorkProofs(siteName, userId) {
  if (!siteName || !userId) return [];
  const data = await apiFetch(
    `${API_BASE_URL}/api/work-proofs/site/${encodeURIComponent(
      siteName
    )}/user/${userId}`,
  );
  return Array.isArray(data) ? data : [];
}

export async function fetchAllWorkProofs() {
  const data = await apiFetch(`${API_BASE_URL}/api/work-proofs`);
  return Array.isArray(data) ? data : [];
}

export async function updateWorkProofStatus(workProofId, status, remarks) {
  if (!workProofId || !status) {
    throw new Error("workProofId and status are required");
  }

  const url = `${API_BASE_URL}/api/work-proofs/${workProofId}/status?status=${encodeURIComponent(
    status
  )}&remarks=${encodeURIComponent(remarks || "")}`;

  return apiFetch(url, {
    method: "PUT",
  });
}
