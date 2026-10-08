import { API_BASE_URL, apiFetch } from "./index";

const SITES_URL = `${API_BASE_URL}/api/sites`;

export const getActiveSites = async () => {
  return apiFetch(`${SITES_URL}/active`);
};

export const getAllSites = async () => {
  return apiFetch(SITES_URL);
};

export const createSite = async (site) => {
  return apiFetch(SITES_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(site),
  });
};

export const updateSite = async (id, site) => {
  return apiFetch(`${SITES_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(site),
  });
};

export const updateSiteStatus = async (id, active) => {
  return apiFetch(`${SITES_URL}/${id}/status?active=${active}`, {
    method: "PATCH",
  });
};