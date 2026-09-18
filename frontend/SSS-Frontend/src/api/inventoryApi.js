import { API_BASE_URL, apiFetch } from "./index";

const INVENTORY_URL = `${API_BASE_URL}/api/inventory`;

export async function fetchInventory() {
  const data = await apiFetch(INVENTORY_URL);
  return Array.isArray(data) ? data : [];
}

export async function fetchLowStockInventory() {
  const data = await apiFetch(`${INVENTORY_URL}/low-stock`);
  return Array.isArray(data) ? data : [];
}

export async function fetchInventoryUsageHistory() {
  const data = await apiFetch(`${INVENTORY_URL}/usage-history`);
  return Array.isArray(data) ? data : [];
}

export async function fetchInventoryItem(id) {
  return apiFetch(`${INVENTORY_URL}/${id}`);
}

export async function createInventoryItem(payload) {
  return apiFetch(INVENTORY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateInventoryItem(id, payload) {
  return apiFetch(`${INVENTORY_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function restockInventoryItem(id, quantity) {
  return apiFetch(
    `${INVENTORY_URL}/${id}/restock?quantity=${encodeURIComponent(quantity)}`,
    {
      method: "POST",
    }
  );
}

export async function useInventoryItem(id, quantity) {
  return apiFetch(
    `${INVENTORY_URL}/${id}/use?quantity=${encodeURIComponent(quantity)}`,
    {
      method: "POST",
    }
  );
}

export async function verifyInventoryUsage(usageId) {
  return apiFetch(
    `${INVENTORY_URL}/usage-history/${usageId}/verify`,
    {
      method: "PUT",
    }
  );
}

export async function deactivateInventoryItem(id) {
  return apiFetch(`${INVENTORY_URL}/${id}/deactivate`, {
    method: "PUT",
  });
}